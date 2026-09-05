from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from src.core.database import get_db
from src.models.approval import ApprovalRequest, ApprovalAuditLog
from src.models.quotation import Quotation, QuoteLine
from src.models.deal import Deal
from src.models.product import Product
from src.services.approval_service import process_approval_decision

router = APIRouter()

class ApprovalDecisionInput(BaseModel):
    action: str # APPROVED, REJECTED, RETURNED
    reason: Optional[str] = None
    actor_id: Optional[str] = "u-mgr-1"

@router.get("")
def list_approvals(db: Session = Depends(get_db)):
    requests = db.query(ApprovalRequest).all()
    results = []
    for r in requests:
        q = db.query(Quotation).filter(Quotation.id == r.quotation_id).first()
        deal = db.query(Deal).filter(Deal.id == q.deal_id).first() if q else None
        results.append({
            "id": r.id,
            "quotation_id": r.quotation_id,
            "deal_id": q.deal_id if q else None,
            "customer_name": deal.customer_name if deal else "Unknown",
            "deal_value": q.total if q else 0.0,
            "risk_score": q.risk_score if q else "LOW",
            "margin_percentage": q.margin_percentage if q else 0.0,
            "status": r.status,
            "created_at": r.created_at
        })
    return results

@router.get("/{approval_id}")
def get_approval_detail(approval_id: str, db: Session = Depends(get_db)):
    r = db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Approval request not found")
        
    q = db.query(Quotation).filter(Quotation.id == r.quotation_id).first()
    deal = db.query(Deal).filter(Deal.id == q.deal_id).first() if q else None
    
    lines = []
    if q:
        for l in q.lines:
            p = db.query(Product).filter(Product.id == l.product_id).first()
            lines.append({
                "id": l.id,
                "product_name": p.name if p else "Product",
                "quantity": l.quantity,
                "unit_price": l.unit_price,
                "discount_percent": l.discount_percent
            })

    logs = []
    for log in r.logs:
        logs.append({
            "id": log.id,
            "actor_id": log.actor_id,
            "action": log.action,
            "reason": log.reason,
            "created_at": log.created_at
        })

    return {
        "id": r.id,
        "quotation_id": r.quotation_id,
        "customer_name": deal.customer_name if deal else "Unknown",
        "deal_value": q.total if q else 0.0,
        "subtotal": q.subtotal if q else 0.0,
        "total_discount": q.total_discount if q else 0.0,
        "margin_percentage": q.margin_percentage if q else 0.0,
        "risk_score": q.risk_score if q else "LOW",
        "status": r.status,
        "lines": lines,
        "logs": logs,
        "created_at": r.created_at
    }

@router.post("/{approval_id}/action")
def process_approval_action(approval_id: str, payload: ApprovalDecisionInput, db: Session = Depends(get_db)):
    result = process_approval_decision(
        db=db,
        approval_request_id=approval_id,
        actor_id=payload.actor_id or "u-mgr-1",
        action=payload.action,
        reason=payload.reason
    )
    return {
        "id": result.id,
        "status": result.status,
        "message": f"Approval request updated to {result.status}"
    }

@router.post("/{approval_id}/approve")
def approve_request(approval_id: str, payload: Optional[ApprovalDecisionInput] = None, db: Session = Depends(get_db)):
    reason = payload.reason if payload else "Approved"
    actor_id = payload.actor_id if payload else "u-mgr-1"
    result = process_approval_decision(db, approval_id, actor_id, "APPROVED", reason)
    return {"id": result.id, "status": result.status}

@router.post("/{approval_id}/reject")
def reject_request(approval_id: str, payload: Optional[ApprovalDecisionInput] = None, db: Session = Depends(get_db)):
    reason = payload.reason if payload else "Rejected"
    actor_id = payload.actor_id if payload else "u-mgr-1"
    result = process_approval_decision(db, approval_id, actor_id, "REJECTED", reason)
    return {"id": result.id, "status": result.status}
