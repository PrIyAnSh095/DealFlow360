from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from src.core.database import get_db
from src.api.deps import get_current_user
from src.models.user import User
from src.models.approval import ApprovalRequest, ApprovalAuditLog
from src.models.quotation import Quotation
from src.models.deal import Deal
from src.schemas.approval import ApprovalActionRequest, ApprovalRequestResponse

router = APIRouter()

@router.get("", response_model=List[ApprovalRequestResponse])
def get_approvals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # For now, we return all approvals. In a real app we'd filter by role.
    reqs = db.query(ApprovalRequest).order_by(ApprovalRequest.created_at.desc()).all()
    
    response_list = []
    for req in reqs:
        # Fetch joined context to make frontend rendering easy
        quote = db.query(Quotation).filter(Quotation.id == req.quotation_id).first()
        deal = None
        if quote:
            deal = db.query(Deal).filter(Deal.id == quote.deal_id).first()
            
        resp = ApprovalRequestResponse.model_validate(req)
        if deal and quote:
            resp.deal_name = deal.name if hasattr(deal, 'name') else f"Deal {deal.id[:8]}"
            resp.customer_name = deal.customer_name
            resp.quote_total = quote.total
            resp.quote_margin = quote.margin_percentage
            
        response_list.append(resp)
        
    return response_list

def perform_approval_action(req_id: str, action: str, next_status: str, payload: ApprovalActionRequest, db: Session, user: User):
    req = db.query(ApprovalRequest).filter(ApprovalRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Approval request not found")
        
    if req.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Cannot {action} a request in {req.status} state")
        
    # Update request
    req.status = next_status
    
    # Update quotation
    quote = db.query(Quotation).filter(Quotation.id == req.quotation_id).first()
    if quote:
        quote.status = next_status if next_status != "RETURNED" else "DRAFT"
        
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
def approve_request(id: str, payload: ApprovalActionRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return perform_approval_action(id, "approve", "APPROVED", payload, db, current_user)

@router.post("/{id}/reject")
def reject_request(id: str, payload: ApprovalActionRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return perform_approval_action(id, "reject", "REJECTED", payload, db, current_user)

@router.post("/{id}/return")
def return_request(id: str, payload: ApprovalActionRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return perform_approval_action(id, "return", "RETURNED", payload, db, current_user)
