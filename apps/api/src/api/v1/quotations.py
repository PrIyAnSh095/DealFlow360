from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from decimal import Decimal

from src.core.database import get_db
from src.core.security import get_current_user
from src.models.user import User
from src.models.quotation import Quotation, QuoteLine
from src.models.product import Product
from src.models.deal import Deal
from src.models.approval import ApprovalRequest, ApprovalAuditLog
from src.services.pricing_service import recalculate_quotation
from src.services.approval_service import submit_quote_for_approval
from src.services.ai_service import ai_service
from src.services.audit_service import log_audit_event
from src.schemas.quotation import ProductResponse

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
    try:
        quotes = db.query(Quotation).options(joinedload(Quotation.deal)).all()
        results = []
        for q in quotes:
            deal = q.deal if hasattr(q, 'deal') and q.deal else db.query(Deal).filter(Deal.id == q.deal_id).first()
            customer_name = "Unknown"
            if deal:
                if hasattr(deal, 'customer_name') and deal.customer_name:
                    customer_name = deal.customer_name
                elif hasattr(deal, 'customer') and deal.customer and hasattr(deal.customer, 'company'):
                    customer_name = deal.customer.company

            results.append({
                "id": q.id,
                "deal_id": q.deal_id,
                "customer_name": customer_name,
                "status": q.status or "draft",
                "subtotal": float(q.subtotal or 0.0),
                "total_discount": float(q.total_discount or 0.0),
                "total": float(q.total or 0.0),
                "margin_percentage": float(q.margin_percentage or 0.0),
                "risk_score": q.risk_score or "LOW",
                "requires_approval": bool(q.requires_approval),
                "created_at": q.created_at
            })
        return results
    except Exception as e:
        print(f"Error in list_quotations: {e}")
        return []

@router.get("/products", response_model=List[ProductResponse])
def list_quotation_products(db: Session = Depends(get_db)):
    return db.query(Product).filter(Product.active.is_(True)).order_by(Product.name).all()

@router.get("/deal/{deal_id}")
def get_latest_quotation_for_deal(deal_id: str, db: Session = Depends(get_db)):
    quotation = (
        db.query(Quotation)
        .filter(Quotation.deal_id == deal_id)
        .order_by(Quotation.created_at.desc())
        .first()
    )
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found for deal")

    return {
        "id": quotation.id,
        "deal_id": quotation.deal_id,
        "status": quotation.status,
        "lines": [
            {
                "product_id": line.product_id,
                "quantity": line.quantity,
                "discount_percent": line.discount_percent,
            }
            for line in quotation.lines
        ],
    }

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
    user_role = current_user.get("role", "sales") if isinstance(current_user, dict) else getattr(current_user, "role", "sales")

    if q.requires_approval:
        app_req = submit_quote_for_approval(db, quotation_id, requester_id=user_id)
        if deal:
            deal.status = "approval"
        
        audit = ApprovalAuditLog(
            approval_request_id=getattr(app_req, "id", None),
            actor_id=user_id,
            action="SUBMITTED",
            reason="Submitted for approval by Sales Rep"
        )
        db.add(audit)
        db.commit()
        return {"status": "SUBMITTED_FOR_APPROVAL", "approval_request_id": getattr(app_req, "id", None), "risk_score": q.risk_score}
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
    allowed_roles = ["sales", "sales_rep", "manager", "sales_manager", "finance", "ops", "finance_ops", "admin"]
    if role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{role}' is not authorized to access quotation AI explanations."
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

class QuotationStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

@router.patch("/{quotation_id}/status")
def update_quotation_status(
    quotation_id: str,
    update_data: QuotationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Allows sales reps and internal users to update quotation status directly in database."""
    q = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")
        
    old_status = q.status
    q.status = update_data.status.upper()
    if hasattr(q, "status_notes") and update_data.notes:
        q.status_notes = update_data.notes
        
    deal = db.query(Deal).filter(Deal.id == q.deal_id).first()
    if deal:
        if update_data.status.upper() in ["ACCEPTED", "APPROVED", "CONFIRMED"]:
            deal.status = "closed_won"
        elif update_data.status.upper() in ["REJECTED", "EXPIRED", "CANCELLED"]:
            deal.status = "closed_lost"
        elif update_data.status.upper() in ["NEGOTIATION", "SENT"]:
            deal.status = "negotiation"

    db.commit()
    db.refresh(q)

    user_id = current_user.get("sub", "system") if isinstance(current_user, dict) else getattr(current_user, "id", "system")
    log_audit_event(
        db,
        user_id=user_id,
        action="QUOTATION_STATUS_UPDATED",
        entity_type="Quotation",
        entity_id=quotation_id,
        details=f"Status updated from {old_status} to {q.status}"
    )

    return {
        "id": q.id,
        "status": q.status,
        "message": f"Quotation status updated to {q.status}"
    }

from fastapi import Response
from src.models.customer import Customer
from src.models.organization import OrganizationProfile
from src.services.pdf_service import generate_quotation_pdf

@router.get("/{quotation_id}/pdf")
def download_quotation_pdf(
    quotation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quote = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found.")

    deal = db.query(Deal).filter(Deal.id == quote.deal_id).first()
    customer = db.query(Customer).filter(Customer.id == deal.customer_id).first() if (deal and deal.customer_id) else None

    org_profile = db.query(OrganizationProfile).filter(OrganizationProfile.id == "org-default").first()
    quote_lines = db.query(QuoteLine).filter(QuoteLine.quotation_id == quote.id).all()

    pdf_bytes = generate_quotation_pdf(quote, customer, org_profile, quote_lines)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Quotation_{quote.id[:8]}.pdf"
        }
    )
