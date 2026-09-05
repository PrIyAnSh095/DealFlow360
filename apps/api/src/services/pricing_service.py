from typing import List, Dict, Tuple
from sqlalchemy.orm import Session
from src.models.product import Product
from src.models.quotation import Quotation, QuoteLine
from src.models.pricing import DiscountPolicy, ApprovalRule

def recalculate_quotation(db: Session, quotation: Quotation) -> Quotation:
    """
    Recalculate subtotal, total_discount, total, margin_percentage, risk_score, 
    and requires_approval on the server side. Never trust client-calculated numbers.
    """
    subtotal = 0.0
    total_discount = 0.0
    total_cost = 0.0

    for line in quotation.lines:
        product = db.query(Product).filter(Product.id == line.product_id).first()
        cost = float(product.cost) if product and product.cost is not None else 0.0
        unit_price = float(line.unit_price) if line.unit_price is not None else (float(product.sales_price) if product else 0.0)
        discount_pct = float(line.discount_percent) if line.discount_percent is not None else 0.0
        
        line_gross = float(line.quantity) * unit_price
        line_discount = line_gross * (discount_pct / 100.0)
        
        subtotal += line_gross
        total_discount += line_discount
        total_cost += float(line.quantity) * cost

    total = subtotal - total_discount
    margin = total - total_cost
    margin_pct = (margin / total * 100.0) if total > 0 else 0.0
    effective_discount_pct = (total_discount / subtotal * 100.0) if subtotal > 0 else 0.0

    quotation.subtotal = round(subtotal, 2)
    quotation.total_discount = round(total_discount, 2)
    quotation.total = round(total, 2)
    quotation.margin_percentage = round(margin_pct, 2)

    # Calculate Risk Score & Approval Requirements
    if effective_discount_pct > 25.0 or margin_pct < 15.0:
        quotation.risk_score = "HIGH"
        quotation.requires_approval = True
    elif effective_discount_pct > 15.0 or margin_pct < 25.0:
        quotation.risk_score = "MEDIUM"
        quotation.requires_approval = True
    else:
        quotation.risk_score = "LOW"
        quotation.requires_approval = False

    db.commit()
    db.refresh(quotation)
    return quotation

def validate_line_discount(db: Session, customer_tier_id: str, category_id: str, requested_discount_pct: float) -> Tuple[bool, str, float]:
    """
    Validates if a requested discount percentage exceeds tier or category ceiling.
    Returns (is_allowed, reason, max_allowed_pct).
    """
    policy = db.query(DiscountPolicy).filter(
        (DiscountPolicy.tier_id == customer_tier_id) | (DiscountPolicy.category_id == category_id)
    ).first()
    
    max_allowed = policy.max_discount_pct if policy else 30.0
    
    if requested_discount_pct > max_allowed:
        return False, f"Requested discount {requested_discount_pct}% exceeds max policy limit of {max_allowed}%", max_allowed
    return True, "Discount is within allowed ceiling", max_allowed
