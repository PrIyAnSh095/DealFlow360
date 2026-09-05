from datetime import datetime
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from src.models.approval import ApprovalRequest, ApprovalAuditLog
from src.models.quotation import Quotation
from src.models.deal import Deal
from src.services.audit_service import log_audit_event

def submit_quote_for_approval(db: Session, quotation_id: str, requester_id: str) -> ApprovalRequest:
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
        
    existing = db.query(ApprovalRequest).filter(
        ApprovalRequest.quotation_id == quotation_id,
        ApprovalRequest.status == "PENDING"
    ).first()
    if existing:
        return existing

    quotation.status = "PENDING_APPROVAL"
    
    app_request = ApprovalRequest(
        quotation_id=quotation_id,
        requester_id=requester_id,
        status="PENDING"
    )
    db.add(app_request)
    db.commit()
    db.refresh(app_request)

    # Log audit entry
    log_audit_event(
        db=db,
        user_id=requester_id,
        action="APPROVAL_SUBMITTED",
        entity_type="Quotation",
        entity_id=quotation_id,
        details=f"Quotation {quotation_id} submitted for approval"
    )

    audit_log = ApprovalAuditLog(
        approval_request_id=app_request.id,
        actor_id=requester_id,
        action="SUBMITTED",
        reason="Initial approval request submission"
    )
    db.add(audit_log)
    db.commit()

    return app_request

def process_approval_decision(
    db: Session,
    approval_request_id: str,
    actor_id: str,
    action: str, # APPROVED, REJECTED, RETURNED
    reason: Optional[str] = None
) -> ApprovalRequest:
    app_request = db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_request_id).first()
    if not app_request:
        raise HTTPException(status_code=404, detail="Approval request not found")

    if app_request.status in ["APPROVED", "REJECTED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Approval request {approval_request_id} has already been finalized as {app_request.status}"
        )

    action_upper = action.upper()
    if action_upper not in ["APPROVED", "REJECTED", "RETURNED"]:
        raise HTTPException(status_code=400, detail=f"Invalid approval action '{action}'")

    app_request.status = action_upper
    
    quotation = db.query(Quotation).filter(Quotation.id == app_request.quotation_id).first()
    if quotation:
        if action_upper == "APPROVED":
            quotation.status = "APPROVED"
            # Update associated deal status if available
            deal = db.query(Deal).filter(Deal.id == quotation.deal_id).first()
            if deal:
                deal.status = "won"
        elif action_upper == "REJECTED":
            quotation.status = "REJECTED"
        elif action_upper == "RETURNED":
            quotation.status = "RETURNED_FOR_REVISION"

    audit_log = ApprovalAuditLog(
        approval_request_id=app_request.id,
        actor_id=actor_id,
        action=action_upper,
        reason=reason or f"Action {action_upper} recorded by user {actor_id}"
    )
    db.add(audit_log)

    log_audit_event(
        db=db,
        user_id=actor_id,
        action=f"APPROVAL_{action_upper}",
        entity_type="ApprovalRequest",
        entity_id=approval_request_id,
        details=f"Decision: {action_upper}, Reason: {reason}"
    )

    db.commit()
    db.refresh(app_request)
    return app_request
