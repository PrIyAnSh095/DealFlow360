from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Optional
from src.core.database import get_db
from src.models.quotation import Quotation, QuoteLine
from src.models.portal import QuoteMessage
from src.models.deal import Deal
from src.models.product import Product
from src.services.negotiation_service import add_customer_message, process_customer_counter_offer

router = APIRouter()

class MessageInput(BaseModel):
    content: str

class CounterOfferInput(BaseModel):
    line_discounts: Dict[str, float] # {quote_line_id: discount_pct}
    message: Optional[str] = None

@router.get("/{public_id}")
def get_customer_portal_quote(public_id: str, db: Session = Depends(get_db)):
    # public_id is mapped to quotation_id
    q = db.query(Quotation).filter(Quotation.id == public_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Quote not found")

    deal = db.query(Deal).filter(Deal.id == q.deal_id).first()

    lines = []
    for line in q.lines:
        p = db.query(Product).filter(Product.id == line.product_id).first()
        lines.append({
            "id": line.id,
            "product_name": p.name if p else "Product",
            "quantity": line.quantity,
            "unit_price": line.unit_price,
            "discount_percent": line.discount_percent,
            "line_total": round(line.quantity * line.unit_price * (1 - line.discount_percent / 100.0), 2)
        })

    messages = db.query(QuoteMessage).filter(QuoteMessage.quotation_id == public_id).all()
    msg_list = []
    for m in messages:
        msg_list.append({
            "id": m.id,
            "sender_type": m.sender_type,
            "content": m.content,
            "created_at": m.created_at
        })

    # HIDE INTERNAL COSTS AND MARGINS FOR CUSTOMER RBAC ISOLATION
    return {
        "quotation_id": q.id,
        "customer_name": deal.customer_name if deal else "Customer",
        "status": q.status,
        "subtotal": q.subtotal,
        "total_discount": q.total_discount,
        "total": q.total,
        "lines": lines,
        "messages": msg_list,
        "created_at": q.created_at
    }

@router.post("/{public_id}/message")
def post_customer_message(public_id: str, payload: MessageInput, db: Session = Depends(get_db)):
    q = db.query(Quotation).filter(Quotation.id == public_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Quote not found")
        
    msg = add_customer_message(db, public_id, payload.content, sender_type="CUSTOMER")
    return {
        "id": msg.id,
        "sender_type": msg.sender_type,
        "content": msg.content,
        "created_at": msg.created_at
    }

@router.post("/{public_id}/counter")
def post_customer_counter(public_id: str, payload: CounterOfferInput, db: Session = Depends(get_db)):
    updated_q = process_customer_counter_offer(
        db=db,
        quotation_id=public_id,
        line_discounts=payload.line_discounts,
        message=payload.message
    )
    return {
        "quotation_id": updated_q.id,
        "status": updated_q.status,
        "total": updated_q.total,
        "message": "Counter offer submitted successfully. Quote sent for re-evaluation."
    }

@router.post("/{public_id}/accept")
def accept_customer_terms(public_id: str, db: Session = Depends(get_db)):
    q = db.query(Quotation).filter(Quotation.id == public_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Quote not found")

    q.status = "ACCEPTED"
    deal = db.query(Deal).filter(Deal.id == q.deal_id).first()
    if deal:
        deal.status = "won"

    add_customer_message(db, public_id, "Customer accepted quote terms.", sender_type="CUSTOMER")
    db.commit()

    return {
        "quotation_id": q.id,
        "status": q.status,
        "message": "Quotation accepted by customer"
    }
