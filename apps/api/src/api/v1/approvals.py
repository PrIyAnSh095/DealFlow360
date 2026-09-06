from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from src.core.database import get_db
from src.api.deps import APPROVAL_ACTION_ROLES, APPROVAL_VIEW_ROLES, RoleChecker
from src.models.user import User
from src.models.approval import ApprovalRequest, ApprovalAuditLog
from src.models.quotation import Quotation
from src.models.deal import Deal
from src.schemas.approval import ApprovalActionRequest, ApprovalRequestResponse

router = APIRouter()

@router.get("", response_model=List[ApprovalRequestResponse])
def get_approvals(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(APPROVAL_VIEW_ROLES))):
    # Ensure any deal in "approval" status has a corresponding ApprovalRequest
    approval_deals = db.query(Deal).filter(Deal.status == "approval").all()
    for deal in approval_deals:
        quote = db.query(Quotation).filter(Quotation.deal_id == deal.id).order_by(Quotation.created_at.desc()).first()
        if quote:
            existing_req = db.query(ApprovalRequest).filter(ApprovalRequest.quotation_id == quote.id).first()
            if not existing_req:
                new_req = ApprovalRequest(
                    quotation_id=quote.id,
                    requester_id=current_user.id if (current_user and hasattr(current_user, 'id')) else "u-sales",
                    status="PENDING"
                )
                db.add(new_req)
                db.commit()

    reqs = db.query(ApprovalRequest).order_by(ApprovalRequest.created_at.desc()).all()
    
    response_list = []
    for req in reqs:
        quote = db.query(Quotation).filter(Quotation.id == req.quotation_id).first()
        deal = None
        if quote:
            deal = db.query(Deal).filter(Deal.id == quote.deal_id).first()
            
        resp = ApprovalRequestResponse.model_validate(req)
        if deal and quote:
            resp.deal_name = deal.customer_name if (deal and deal.customer_name) else f"Deal {deal.id[:8]}"
            resp.customer_name = deal.customer_name if (deal and deal.customer_name) else (deal.customer.name if (deal and hasattr(deal, 'customer') and deal.customer) else "Customer")
            resp.quote_total = quote.total
            resp.quote_margin = quote.margin_percentage
            
        response_list.append(resp)
        
    return response_list

def perform_approval_action(req_id: str, action: str, payload: ApprovalActionRequest, db: Session, user: User):
    req = db.query(ApprovalRequest).filter(ApprovalRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Approval request not found")
        
    if req.status in ["APPROVED", "REJECTED", "RETURNED"]:
        raise HTTPException(status_code=400, detail=f"Cannot {action} a request already in {req.status} state")

    next_status = None
    
    if action == "approve":
        if req.status in ["PENDING", "PENDING_MANAGER"]:
            # If multi-step is strictly required by role rules we can transition or approve directly
            next_status = "APPROVED"
        elif req.status == "PENDING_FINANCE":
            next_status = "APPROVED"
        else:
            next_status = "APPROVED"
    elif action == "reject":
        next_status = "REJECTED"
    elif action == "return":
        next_status = "RETURNED"
    else:
        raise HTTPException(status_code=400, detail=f"Invalid action {action}")
        
    # Update request
    req.status = next_status
    
    # Update quotation and deal status
    quote = db.query(Quotation).filter(Quotation.id == req.quotation_id).first()
    if quote:
        quote.status = next_status if next_status != "RETURNED" else "DRAFT"
        deal = db.query(Deal).filter(Deal.id == quote.deal_id).first()
        if deal:
            if next_status == "APPROVED":
                deal.status = "negotiation"
            elif next_status == "REJECTED":
                deal.status = "lost"
            elif next_status == "RETURNED":
                deal.status = "draft"
        
    # Log audit trail
    log = ApprovalAuditLog(
        approval_request_id=req.id,
        actor_id=user.id,
        action=action.upper(),
        reason=payload.reason
    )
    db.add(log)
    db.commit()
    return {"message": "Success"}

@router.post("/{id}/approve")
def approve_request(id: str, payload: ApprovalActionRequest, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(APPROVAL_ACTION_ROLES))):
    return perform_approval_action(id, "approve", payload, db, current_user)

@router.post("/{id}/reject")
def reject_request(id: str, payload: ApprovalActionRequest, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(APPROVAL_ACTION_ROLES))):
    return perform_approval_action(id, "reject", payload, db, current_user)

@router.post("/{id}/return")
def return_request(id: str, payload: ApprovalActionRequest, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(APPROVAL_ACTION_ROLES))):
    return perform_approval_action(id, "return", payload, db, current_user)
