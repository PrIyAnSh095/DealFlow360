from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from src.core.database import get_db
from src.core.security import get_current_user
from src.models.quotation import Quotation, QuoteLine
from src.models.product import Product
from src.models.deal import Deal
from src.services.pricing_service import recalculate_quotation
from src.services.approval_service import submit_quote_for_approval
from src.services.ai_service import ai_service
from src.services.audit_service import log_audit_event

router = APIRouter()

class QuoteLineInput(BaseModel):
    product_id: str
    quantity: int = 1
    discount_percent: float = 0.0

class CreateQuoteInput(BaseModel):
    deal_id: str
    lines: List[QuoteLineInput]

@router.get("")
def list_quotations(db: Session = Depends(get_db)):
    quotes = db.query(Quotation).all()
    results = []
    for q in quotes:
        deal = db.query(Deal).filter(Deal.id == q.deal_id).first()
        results.append({
            "id": q.id,
            "deal_id": q.deal_id,
            "customer_name": deal.customer_name if deal else "Unknown",
            "status": q.status,
            "subtotal": q.subtotal,
            "total_discount": q.total_discount,
            "total": q.total,
            "margin_percentage": q.margin_percentage,
            "risk_score": q.risk_score,
            "requires_approval": q.requires_approval,
            "created_at": q.created_at
        })
    return results

@router.get("/{quotation_id}")
def get_quotation(quotation_id: str, db: Session = Depends(get_db)):
    q = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")
        
    deal = db.query(Deal).filter(Deal.id == q.deal_id).first()
    lines_data = []
    for line in q.lines:
        p = db.query(Product).filter(Product.id == line.product_id).first()
        lines_data.append({
            "id": line.id,
            "product_id": line.product_id,
            "product_name": p.name if p else "Product",
            "quantity": line.quantity,
            "unit_price": line.unit_price,
            "discount_percent": line.discount_percent
        })

    return {
        "id": q.id,
        "deal_id": q.deal_id,
        "customer_name": deal.customer_name if deal else "Unknown",
        "status": q.status,
        "subtotal": q.subtotal,
        "total_discount": q.total_discount,
        "total": q.total,
        "margin_percentage": q.margin_percentage,
        "risk_score": q.risk_score,
        "requires_approval": q.requires_approval,
        "lines": lines_data,
        "created_at": q.created_at
    }

@router.post("/{quotation_id}/recalculate")
def recalculate_quote_endpoint(quotation_id: str, db: Session = Depends(get_db)):
    q = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")
    updated_q = recalculate_quotation(db, q)
    return {
        "id": updated_q.id,
        "subtotal": updated_q.subtotal,
        "total_discount": updated_q.total_discount,
        "total": updated_q.total,
        "margin_percentage": updated_q.margin_percentage,
        "risk_score": updated_q.risk_score,
        "requires_approval": updated_q.requires_approval
    }

@router.post("/{quotation_id}/submit")
def submit_quote(quotation_id: str, db: Session = Depends(get_db)):
    q = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")
        
    recalculate_quotation(db, q)
    if q.requires_approval:
        app_req = submit_quote_for_approval(db, quotation_id, requester_id="u-sales")
        return {"status": "SUBMITTED_FOR_APPROVAL", "approval_request_id": app_req.id, "risk_score": q.risk_score}
    else:
        q.status = "APPROVED"
        db.commit()
        return {"status": "APPROVED", "message": "Quotation approved automatically (Low Risk)"}

@router.post("/{quotation_id}/ai-explanation")
def get_quotation_ai_explanation(
    quotation_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Generates an AI quotation explanation for authorized roles only.
    Forbidden for Customer / Customer Portal roles (returns 403).
    """
    role = current_user.get("role", "").lower()
    if role in ["customer", "client"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role 'customer' is not authorized to access quotation AI explanations."
        )

    q = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")

    context = ai_service.build_quotation_ai_context(db, quotation_id)
    explanation = ai_service.generate_explanation(context, role=role)

    log_audit_event(
        db,
        user_id=current_user.get("sub", "system"),
        action="AI_EXPLANATION_REQUESTED",
        entity_type="Quotation",
        entity_id=quotation_id,
        details=f"User with role '{role}' requested AI explanation for quote {quotation_id}"
    )

    return explanation

