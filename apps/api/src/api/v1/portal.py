from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from src.core.database import get_db
from src.models.quotation import Quotation, QuoteLine
from src.models.deal import Deal
from src.models.portal import QuoteMessage
from src.schemas.portal import PublicQuotationResponse, QuoteMessageResponse, QuoteMessageCreate, PublicQuoteLineResponse
from src.services.negotiation_service import process_customer_counter_offer

router = APIRouter()

def get_public_quote_or_404(public_id: str, db: Session) -> tuple[Quotation, Deal]:
    quote = db.query(Quotation).filter(Quotation.id == public_id).first()
    
    if not quote:
        quote = db.query(Quotation).filter(Quotation.deal_id == public_id).order_by(Quotation.created_at.desc()).first()
        
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found")
        
    deal = db.query(Deal).filter(Deal.id == quote.deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Associated deal not found")
        
    return quote, deal

@router.get("/quotes/{public_id}", response_model=PublicQuotationResponse)
def get_public_quote(public_id: str, db: Session = Depends(get_db)):
    quote, deal = get_public_quote_or_404(public_id, db)
    
    resp = PublicQuotationResponse(
        id=quote.id,
        status=quote.status,
        subtotal=quote.subtotal,
        total_discount=quote.total_discount,
        total=quote.total,
        deal_name=f"Quote for {deal.customer_name}",
        customer_name=deal.customer_name,
        lines=[]
    )
    
    lines = db.query(QuoteLine).filter(QuoteLine.quotation_id == quote.id).all()
    for line in lines:
        from src.models.product import Product
        product = db.query(Product).filter(Product.id == line.product_id).first()
        
        resp.lines.append(PublicQuoteLineResponse(
            id=line.id,
            product_id=line.product_id,
            product_name=product.name if product else "Unknown Product",
            quantity=line.quantity,
            unit_price=line.unit_price,
            discount_percent=line.discount_percent,
            total_price=(line.unit_price * line.quantity) * (1 - (line.discount_percent / 100))
        ))
        
    return resp

@router.get("/quotes/{public_id}/messages", response_model=List[QuoteMessageResponse])
def get_quote_messages(public_id: str, db: Session = Depends(get_db)):
    quote, deal = get_public_quote_or_404(public_id, db)
    messages = db.query(QuoteMessage).filter(QuoteMessage.quotation_id == quote.id).order_by(QuoteMessage.created_at.asc()).all()
    return messages

@router.post("/quotes/{public_id}/messages", response_model=QuoteMessageResponse)
def post_quote_message(public_id: str, payload: QuoteMessageCreate, db: Session = Depends(get_db)):
    quote, deal = get_public_quote_or_404(public_id, db)
    
    msg = QuoteMessage(
        quotation_id=quote.id,
        content=payload.content,
        sender_type=payload.sender_type
    )
    db.add(msg)
    
    if payload.sender_type == "CUSTOMER" and quote.status in ["APPROVED", "SENT"]:
        quote.status = "NEGOTIATION"
        
    db.commit()
    db.refresh(msg)
    return msg

@router.post("/quotes/{public_id}/counter")
def counter_offer(
    public_id: str,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Customer submits line discount counters and message.
    Recalculates quote and routes for reapproval if thresholds are exceeded.
    """
    quote, deal = get_public_quote_or_404(public_id, db)
    line_discounts = payload.get("line_discounts", {})
    message = payload.get("message")
    
    updated_quote = process_customer_counter_offer(db, quote.id, line_discounts, message)
    return {
        "message": "Counter offer submitted successfully",
        "quotation_id": updated_quote.id,
        "status": updated_quote.status,
        "total": updated_quote.total,
        "requires_approval": updated_quote.requires_approval
    }

@router.post("/quotes/{public_id}/confirm")
def confirm_quote(public_id: str, db: Session = Depends(get_db)):
    quote, deal = get_public_quote_or_404(public_id, db)
    
    if quote.status not in ["APPROVED", "SENT", "NEGOTIATION", "CUSTOMER_REVIEW"]:
        raise HTTPException(status_code=400, detail="Quote cannot be confirmed in its current state")
        
    quote.status = "ACCEPTED"
    deal.status = "won"
    
    msg = QuoteMessage(
        quotation_id=quote.id,
        content="Customer formally accepted the quotation.",
        sender_type="SYSTEM"
    )
    db.add(msg)
    
    db.commit()
    return {"message": "Quote accepted successfully"}
