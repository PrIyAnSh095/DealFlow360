from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from src.core.database import get_db
from src.models.quotation import Quotation, QuoteLine
from src.models.deal import Deal
from src.models.portal import QuoteMessage
from src.schemas.portal import PublicQuotationResponse, QuoteMessageResponse, QuoteMessageCreate

router = APIRouter()

def get_public_quote_or_404(public_id: str, db: Session) -> tuple[Quotation, Deal]:
    quote = db.query(Quotation).filter(Quotation.id == public_id).first()
    
    # Fallback for MVP: if public_id is actually a deal_id, find the latest quote for that deal
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
    
    # We do NOT include cost, margin, or risk_score here.
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
    
    # Attach lines safely
    lines = db.query(QuoteLine).filter(QuoteLine.quotation_id == quote.id).all()
    # We can use the QuoteLine schema which includes product details
    # The frontend needs to know product names
    for line in lines:
        from src.models.product import Product
        product = db.query(Product).filter(Product.id == line.product_id).first()
        from src.schemas.portal import PublicQuoteLineResponse
        
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
    
    # Change status to NEGOTIATION if the customer comments on a PENDING or APPROVED quote
    if payload.sender_type == "CUSTOMER" and quote.status in ["APPROVED", "SENT"]:
        quote.status = "NEGOTIATION"
        
    db.commit()
    db.refresh(msg)
    return msg

@router.post("/quotes/{public_id}/confirm")
def confirm_quote(public_id: str, db: Session = Depends(get_db)):
    quote, deal = get_public_quote_or_404(public_id, db)
    
    if quote.status not in ["APPROVED", "SENT", "NEGOTIATION"]:
        raise HTTPException(status_code=400, detail="Quote cannot be confirmed in its current state")
        
    quote.status = "ACCEPTED"
    deal.status = "won"
    
    # Log the action automatically as a message
    msg = QuoteMessage(
        quotation_id=quote.id,
        content="Customer formally accepted the quotation.",
        sender_type="SYSTEM"
    )
    db.add(msg)
    
    db.commit()
    return {"message": "Quote accepted successfully"}
