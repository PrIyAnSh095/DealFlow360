from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from src.core.database import get_db
from src.api.deps import QUOTE_VIEW_ROLES, QUOTE_WRITE_ROLES, RoleChecker
from src.models.user import User
from src.models.product import Product
from src.models.quotation import Quotation, QuoteLine
from src.models.deal import Deal
from src.models.approval import ApprovalRequest, ApprovalAuditLog
from src.schemas.quotation import QuoteRecalculateRequest, QuoteRecalculateResponse, QuoteLineResponse, ProductResponse, QuotationCreate, QuotationResponse
from decimal import Decimal

router = APIRouter()

from src.models.admin import DiscountPolicy, ApprovalRule

# Removed hardcoded CATEGORY_DISCOUNT_LIMITS

@router.get("/products", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(QUOTE_VIEW_ROLES))):
    return db.query(Product).filter(Product.active == True).all()

@router.post("/{quotation_id}/recalculate", response_model=QuoteRecalculateResponse)
def recalculate_quotation(
    quotation_id: str, 
    request: QuoteRecalculateRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(RoleChecker(QUOTE_WRITE_ROLES))
):
    subtotal = Decimal('0.0')
    total_discount = Decimal('0.0')
    estimated_cost = Decimal('0.0')
    
    explanations = []
    requires_approval = False
    
    lines_response = []
    
    active_policies = db.query(DiscountPolicy).filter(DiscountPolicy.is_active == True).all()
    active_rules = db.query(ApprovalRule).filter(ApprovalRule.is_active == True).all()
    
    for line_in in request.lines:
        product = db.query(Product).filter(Product.id == line_in.product_id).first()
        if not product:
            continue
            
        # Financials for this line
        line_gross = product.sales_price * Decimal(line_in.quantity)
        line_discount_amt = line_gross * (line_in.discount_percent / Decimal('100.0'))
        line_net = line_gross - line_discount_amt
        line_cost = product.cost * Decimal(line_in.quantity)
        
        # Policy evaluation for this line
        policy = next((p for p in active_policies if p.target_category == product.category), None)
        if not policy:
            policy = next((p for p in active_policies if not p.target_category and not p.target_tier), None)
            
        limit = Decimal(policy.max_discount_percent) if policy else Decimal('10.0')
        min_margin = Decimal(policy.min_margin_percent) if policy and policy.min_margin_percent is not None else Decimal('20.0')
        
        if line_in.discount_percent > limit:
            requires_approval = True
            explanations.append(f"{product.name} ({product.category}) discount of {line_in.discount_percent}% exceeds policy limit of {limit}%")
            
        line_margin = Decimal('0.0')
        if line_net > Decimal('0.0'):
            line_margin = ((line_net - line_cost) / line_net) * Decimal('100.0')
            
        # Accumulate
        subtotal += line_gross
        total_discount += line_discount_amt
        estimated_cost += line_cost
        
        lines_response.append(QuoteLineResponse(
            product_id=product.id,
            product_name=product.name,
            quantity=line_in.quantity,
            unit_price=product.sales_price,
            discount_percent=line_in.discount_percent,
            line_total=line_net.quantize(Decimal('0.01')),
            line_margin_percent=line_margin.quantize(Decimal('0.01'))
        ))
        
    # Global metrics
    total = subtotal - total_discount
    margin_percentage = Decimal('0.0')
    if total > Decimal('0.0'):
        margin_percentage = ((total - estimated_cost) / total) * Decimal('100.0')
        
    risk_score = "LOW"
    
    # Check overall margin against rules
    for rule in active_rules:
        if rule.discount_threshold and subtotal > 0:
            overall_discount_pct = (total_discount / subtotal) * Decimal('100.0')
            if overall_discount_pct > Decimal(rule.discount_threshold):
                requires_approval = True
                if rule.risk_threshold:
                    risk_score = rule.risk_threshold.upper()
                explanations.append(f"Overall discount {overall_discount_pct.quantize(Decimal('0.01'))}% exceeds rule threshold of {rule.discount_threshold}%")
                
    if requires_approval and risk_score == "LOW":
        risk_score = "HIGH"
    elif margin_percentage < Decimal('20.0') and risk_score == "LOW":
        risk_score = "MEDIUM"
        
    return QuoteRecalculateResponse(
        subtotal=subtotal.quantize(Decimal('0.01')),
        total_discount=total_discount.quantize(Decimal('0.01')),
        total=total.quantize(Decimal('0.01')),
        estimated_cost=estimated_cost.quantize(Decimal('0.01')),
        margin_percentage=margin_percentage.quantize(Decimal('0.01')),
        risk_score=risk_score,
        requires_approval=requires_approval,
        explanations=explanations,
        lines=lines_response
    )

@router.post("/", response_model=QuotationResponse)
def create_quotation(
    request: QuotationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(QUOTE_WRITE_ROLES))
):
    deal = db.query(Deal).filter(Deal.id == request.deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    # Run recalculation logic to get final values
    recalc_request = QuoteRecalculateRequest(lines=request.lines)
    calc_result = recalculate_quotation("new", recalc_request, db, current_user)
    
    quotation = Quotation(
        deal_id=request.deal_id,
        subtotal=calc_result.subtotal,
        total_discount=calc_result.total_discount,
        total=calc_result.total,
        margin_percentage=calc_result.margin_percentage,
        risk_score=calc_result.risk_score,
        requires_approval=calc_result.requires_approval
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
    
    # Update deal risk based on quote
    deal.risk = calc_result.risk_score
    deal.value = calc_result.total
    if calc_result.requires_approval:
        deal.status = "approval"
    db.commit()

    return quotation

@router.get("/{quotation_id}", response_model=QuotationResponse)
def get_quotation(
    quotation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(QUOTE_VIEW_ROLES))
):
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return quotation

@router.get("/", response_model=List[QuotationResponse])
def get_quotations(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(QUOTE_VIEW_ROLES))
):
    quotations = db.query(Quotation).all()
    return quotations

@router.post("/{quotation_id}/submit", response_model=QuotationResponse)
def submit_quotation(
    quotation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(QUOTE_WRITE_ROLES))
):
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
        
    deal = db.query(Deal).filter(Deal.id == quotation.deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    # Lock quote and update status
    quotation.status = "pending_approval" if quotation.requires_approval else "approved"
    
    # Update deal
    if quotation.requires_approval:
        deal.status = "approval"
        
        # Create approval request
        approval_req = ApprovalRequest(
            quotation_id=quotation.id,
            requester_id=current_user.id,
            status="PENDING"
        )
        db.add(approval_req)
        db.flush() # flush to get the ID
        
        # Create approval request audit
        audit = ApprovalAuditLog(
            approval_request_id=approval_req.id,
            actor_id=current_user.id,
            action="SUBMITTED",
            reason="Submitted for approval by Sales Rep"
        )
        db.add(audit)
    else:
        deal.status = "negotiation"

    db.commit()
    db.refresh(quotation)
    return quotation


