from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from src.core.database import get_db
from src.core.security import get_current_user
from src.models.user import User
from src.models.portal import QuoteMessage
from src.models.quotation import Quotation, QuoteLine
from src.models.deal import Deal
from src.models.product import Product
from src.models.approval import ApprovalRequest
from src.services.pricing_service import recalculate_quotation
from src.services.approval_service import submit_quote_for_approval
from src.services.audit_service import log_audit_event

router = APIRouter()

class NegotiationResponseInput(BaseModel):
    action: str # ACCEPT, COUNTER, REJECT
    message: Optional[str] = None
    counter_discount_pct: Optional[float] = None

class NegotiationItemResponse(BaseModel):
    id: str
    quotation_id: str
    deal_id: str
    customer_name: str
    deal_name: str
    content: str
    status: str
    sender_type: str
    counter_discount_pct: Optional[float] = None
    quote_total: float
    quote_margin: float
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("", response_model=List[NegotiationItemResponse])
@router.get("/", response_model=List[NegotiationItemResponse])
def get_pending_negotiations(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        user_id = current_user.get("sub") if isinstance(current_user, dict) else getattr(current_user, "id", None)
        user_role = (current_user.get("role") if isinstance(current_user, dict) else getattr(current_user, "role", "")).lower()

        query = db.query(QuoteMessage).filter(QuoteMessage.sender_type == "CUSTOMER")
        messages = query.order_by(QuoteMessage.created_at.desc()).all()

        results = []
        for msg in messages:
            try:
                quote = db.query(Quotation).filter(Quotation.id == msg.quotation_id).first()
                if not quote:
                    continue

                deal = db.query(Deal).filter(Deal.id == quote.deal_id).first()
                if not deal:
                    continue

                # IDOR Check: Filter for Sales Rep assigned deals only
                if user_role == "sales_rep":
                    is_owner = (deal.owner_id == user_id) if deal.owner_id else False
                    is_cust_rep = (deal.customer and getattr(deal.customer, "assigned_sales_rep_id", None) == user_id) if deal.customer else False
                    if not is_owner and not is_cust_rep and deal.owner_id is not None:
                        continue

                cust_name = deal.customer_name if (deal and deal.customer_name) else (deal.customer.name if (deal and hasattr(deal, 'customer') and deal.customer) else "Customer")

                results.append(NegotiationItemResponse(
                    id=msg.id,
                    quotation_id=quote.id,
                    deal_id=deal.id,
                    customer_name=cust_name,
                    deal_name=f"Quote for {cust_name}",
                    content=msg.content or "",
                    status=msg.status or "PENDING_REP_RESPONSE",
                    sender_type=msg.sender_type or "CUSTOMER",
                    counter_discount_pct=msg.counter_discount_pct,
                    quote_total=quote.total or 0.0,
                    quote_margin=quote.margin_percentage or 0.0,
                    created_at=msg.created_at
                ))
            except Exception:
                continue

        return results
    except Exception:
        return []

@router.get("/{message_id}", response_model=NegotiationItemResponse)
def get_negotiation_detail(
    message_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub") if isinstance(current_user, dict) else getattr(current_user, "id", None)
    user_role = (current_user.get("role") if isinstance(current_user, dict) else getattr(current_user, "role", "")).lower()

    msg = db.query(QuoteMessage).filter(QuoteMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Negotiation message not found")

    quote = db.query(Quotation).filter(Quotation.id == msg.quotation_id).first()
    deal = db.query(Deal).filter(Deal.id == quote.deal_id).first() if quote else None

    if user_role == "sales_rep" and deal:
        is_owner = (deal.owner_id == user_id) if deal.owner_id else False
        is_cust_rep = (deal.customer.assigned_sales_rep_id == user_id) if (deal.customer and getattr(deal.customer, "assigned_sales_rep_id", None)) else False
        if not is_owner and not is_cust_rep and deal.owner_id is not None:
            raise HTTPException(status_code=403, detail="Forbidden: Negotiation belongs to another Sales Rep.")

    cust_name = deal.customer_name if (deal and deal.customer_name) else (deal.customer.name if (deal and hasattr(deal, 'customer') and deal.customer) else "Customer")

    return NegotiationItemResponse(
        id=msg.id,
        quotation_id=quote.id if quote else "",
        deal_id=deal.id if deal else "",
        customer_name=cust_name,
        deal_name=f"Quote for {cust_name}",
        content=msg.content,
        status=msg.status or "PENDING_REP_RESPONSE",
        sender_type=msg.sender_type,
        counter_discount_pct=msg.counter_discount_pct,
        quote_total=quote.total if quote else 0.0,
        quote_margin=quote.margin_percentage if quote else 0.0,
        created_at=msg.created_at
    )

@router.post("/{message_id}/respond")
def respond_to_negotiation(
    message_id: str,
    payload: NegotiationResponseInput,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub") if isinstance(current_user, dict) else getattr(current_user, "id", None)
    user_role = (current_user.get("role") if isinstance(current_user, dict) else getattr(current_user, "role", "")).lower()

    msg = db.query(QuoteMessage).filter(QuoteMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Negotiation request not found")

    quote = db.query(Quotation).filter(Quotation.id == msg.quotation_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found")

    deal = db.query(Deal).filter(Deal.id == quote.deal_id).first()

    # IDOR ownership check
    if user_role == "sales_rep" and deal:
        is_owner = (deal.owner_id == user_id) if deal.owner_id else False
        is_cust_rep = (deal.customer.assigned_sales_rep_id == user_id) if (deal.customer and getattr(deal.customer, "assigned_sales_rep_id", None)) else False
        if not is_owner and not is_cust_rep and deal.owner_id is not None:
            raise HTTPException(status_code=403, detail="Forbidden: Negotiation belongs to another Sales Rep.")

    action_upper = payload.action.upper()
    if action_upper not in ["ACCEPT", "COUNTER", "REJECT"]:
        raise HTTPException(status_code=400, detail="Action must be ACCEPT, COUNTER, or REJECT")

    msg.status = action_upper

    # Log Sales Rep response message
    resp_text = payload.message or f"Sales Rep {action_upper.lower()}ed the negotiation request."
    rep_msg = QuoteMessage(
        quotation_id=quote.id,
        sender_id=user_id,
        sender_type="SALES_REP",
        content=resp_text,
        status=action_upper,
        counter_discount_pct=payload.counter_discount_pct
    )
    db.add(rep_msg)

    # Apply discount updates if ACCEPTED or COUNTERED
    if action_upper in ["ACCEPT", "COUNTER"]:
        new_disc = payload.counter_discount_pct if payload.counter_discount_pct is not None else (msg.counter_discount_pct or 10.0)
        lines = db.query(QuoteLine).filter(QuoteLine.quotation_id == quote.id).all()
        for line in lines:
            line.discount_percent = float(new_disc)

        db.flush()
        updated_q = recalculate_quotation(db, quote)

        # Trigger reapproval if discount threshold rules require approval
        if updated_q.requires_approval:
            app_req = submit_quote_for_approval(db, quote.id, requester_id=user_id or "u-sales")
            if deal:
                deal.status = "approval"
            log_audit_event(
                db=db,
                user_id=user_id or "system",
                action="REAPPROVAL_TRIGGERED",
                entity_type="Quotation",
                entity_id=quote.id,
                details=f"Negotiation discount change to {new_disc}% triggered reapproval."
            )
        else:
            if deal:
                deal.status = "negotiation"
    elif action_upper == "REJECT":
        if deal:
            deal.status = "negotiation"

    db.commit()

    log_audit_event(
        db=db,
        user_id=user_id or "system",
        action="SALES_REP_NEGOTIATION_RESPONSE",
        entity_type="QuoteMessage",
        entity_id=msg.id,
        details=f"Sales rep action: {action_upper}, notes: {resp_text}"
    )

    return {
        "message": f"Negotiation response '{action_upper}' submitted successfully.",
        "quotation_id": quote.id,
        "deal_status": deal.status if deal else quote.status,
        "requires_approval": quote.requires_approval
    }
