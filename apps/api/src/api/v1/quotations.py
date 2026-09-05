from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal

from src.core.database import get_db
from src.core.security import get_current_user
from src.models.quotation import Quotation, QuoteLine
from src.models.product import Product
from src.models.deal import Deal
from src.models.approval import ApprovalAuditLog
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

class QuoteRecalculateRequest(BaseModel):
    lines: List[QuoteLineInput]

@router.get("")
@router.get("/")
def list_quotations(db: Session = Depends(get_db)):
    quotes = db.query(Quotation).all()
    results = []
    for q in quotes:
        deal = db.query(Deal).filter(Deal.id == q.deal_id).first()
        results.append({
            "id": q.id,
            "deal_id": q.deal_id,
            "customer_name": deal.customer_name if (deal and hasattr(deal, 'customer_name')) else "Unknown",
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
        "customer_name": deal.customer_name if (deal and hasattr(deal, 'customer_name')) else "Unknown",
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

@router.post("")
@router.post("/")
def create_quotation(
    request: CreateQuoteInput,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    deal = db.query(Deal).filter(Deal.id == request.deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    quotation = Quotation(
        deal_id=request.deal_id,
        subtotal=0.0,
        total_discount=0.0,
        total=0.0,
        margin_percentage=0.0,
        risk_score="LOW",
        requires_approval=False,
        status="DRAFT"
    )
    db.add(quotation)
    db.commit()
    db.refresh(quotation)

    for line_in in request.lines:
        product = db.query(Product).filter(Product.id == line_in.product_id).first()
        if product:
            q_line = QuoteLine(
                quotation_id=quotation.id,
                product_id=product.id,
                quantity=line_in.quantity,
                unit_price=product.sales_price,
                discount_percent=line_in.discount_percent
            )
            db.add(q_line)

    db.commit()
    db.refresh(quotation)
    
    updated_q = recalculate_quotation(db, quotation)
    
    # Update deal risk & value based on quote
    deal.risk = updated_q.risk_score
    deal.value = updated_q.total
    if updated_q.requires_approval:
        deal.status = "approval"
    db.commit()

    return updated_q

@router.post("/{quotation_id}/recalculate")
def recalculate_quote_endpoint(
    quotation_id: str,
    request: Optional[QuoteRecalculateRequest] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")

    if request and request.lines:
        # Update existing lines or replace
        db.query(QuoteLine).filter(QuoteLine.quotation_id == quotation_id).delete()
        for line_in in request.lines:
            product = db.query(Product).filter(Product.id == line_in.product_id).first()
            if product:
                q_line = QuoteLine(
                    quotation_id=q.id,
                    product_id=product.id,
                    quantity=line_in.quantity,
                    unit_price=product.sales_price,
                    discount_percent=line_in.discount_percent
                )
                db.add(q_line)
        db.commit()
        db.refresh(q)

    updated_q = recalculate_quotation(db, q)
    lines_data = []
    for line in updated_q.lines:
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
        "id": updated_q.id,
        "subtotal": updated_q.subtotal,
        "total_discount": updated_q.total_discount,
        "total": updated_q.total,
        "margin_percentage": updated_q.margin_percentage,
        "risk_score": updated_q.risk_score,
        "requires_approval": updated_q.requires_approval,
        "lines": lines_data
    }

@router.post("/{quotation_id}/submit")
def submit_quote(
    quotation_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    q = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")
        
    deal = db.query(Deal).filter(Deal.id == q.deal_id).first()
    recalculate_quotation(db, q)

    user_id = current_user.get("sub") if isinstance(current_user, dict) else getattr(current_user, "id", "u-sales")

    if q.requires_approval:
        app_req = submit_quote_for_approval(db, quotation_id, requester_id=user_id)
        if deal:
            deal.status = "approval"
        
        audit = ApprovalAuditLog(
            deal_id=deal.id if deal else q.deal_id,
            action="submit",
            role=current_user.get("role", "sales") if isinstance(current_user, dict) else getattr(current_user, "role", "sales"),
            notes="Submitted for approval by Sales Rep"
        )
        db.add(audit)
        db.commit()
        return {"status": "SUBMITTED_FOR_APPROVAL", "approval_request_id": app_req.id, "risk_score": q.risk_score}
    else:
        q.status = "APPROVED"
        if deal:
            deal.status = "negotiation"
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
    role = current_user.get("role", "").lower() if isinstance(current_user, dict) else getattr(current_user, "role", "").lower()
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

    user_id = current_user.get("sub", "system") if isinstance(current_user, dict) else getattr(current_user, "id", "system")
    log_audit_event(
        db,
        user_id=user_id,
        action="AI_EXPLANATION_REQUESTED",
        entity_type="Quotation",
        entity_id=quotation_id,
        details=f"User with role '{role}' requested AI explanation for quote {quotation_id}"
    )

    return explanation


