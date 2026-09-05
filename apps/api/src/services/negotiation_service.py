from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from src.models.quotation import Quotation, QuoteLine
from src.models.portal import QuoteMessage
from src.models.deal import Deal
from src.services.pricing_service import recalculate_quotation
from src.services.approval_service import submit_quote_for_approval
from src.services.audit_service import log_audit_event

def add_customer_message(db: Session, quotation_id: str, content: str, sender_type: str = "CUSTOMER") -> QuoteMessage:
    msg = QuoteMessage(
        quotation_id=quotation_id,
        sender_type=sender_type,
        content=content
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

def process_customer_counter_offer(db: Session, quotation_id: str, line_discounts: Dict[str, float], message: Optional[str] = None) -> Quotation:
    """
    Customer counters a discount.
    Recalculates quote, risk score, margin, and triggers re-approval if required.
    Hides internal cost/margin details from customer responses.
    """
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    for line_id, new_discount in line_discounts.items():
        line = db.query(QuoteLine).filter(QuoteLine.id == line_id, QuoteLine.quotation_id == quotation_id).first()
        if line:
            line.discount_percent = max(0.0, min(100.0, float(new_discount)))

    if message:
        add_customer_message(db, quotation_id, f"Counter Offer: {message}", sender_type="CUSTOMER")

    # Recalculate quotation server-side
    recalculate_quotation(db, quotation)

    # If risk is elevated or requires approval, trigger re-approval workflow
    if quotation.requires_approval:
        quotation.status = "PENDING_APPROVAL"
        submit_quote_for_approval(db, quotation_id, requester_id="u-customer-portal")

    log_audit_event(
        db=db,
        user_id="customer",
        action="CUSTOMER_COUNTER_OFFER",
        entity_type="Quotation",
        entity_id=quotation_id,
        details=f"Customer submitted counter offer. New Total: {quotation.total}, Risk: {quotation.risk_score}"
    )

    db.commit()
    db.refresh(quotation)
    return quotation
