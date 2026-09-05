from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from src.core.database import get_db
from src.api.deps import get_current_user
from src.models.user import User
from src.models.product import Product
from src.models.quotation import Quotation, QuoteLine
from src.schemas.quotation import QuoteRecalculateRequest, QuoteRecalculateResponse, QuoteLineResponse, ProductResponse

router = APIRouter()

# Discount ceilings by category (as per FR-05 logic)
CATEGORY_DISCOUNT_LIMITS = {
    "hardware": 15.0,
    "service": 10.0,
    "software": 20.0,
}

@router.get("/products", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Product).filter(Product.active == True).all()

@router.post("/{quotation_id}/recalculate", response_model=QuoteRecalculateResponse)
def recalculate_quotation(
    quotation_id: str, 
    request: QuoteRecalculateRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    subtotal = 0.0
    total_discount = 0.0
    estimated_cost = 0.0
    
    explanations = []
    requires_approval = False
    
    lines_response = []
    
    for line_in in request.lines:
        product = db.query(Product).filter(Product.id == line_in.product_id).first()
        if not product:
            continue
            
        # Financials for this line
        line_gross = product.sales_price * line_in.quantity
        line_discount_amt = line_gross * (line_in.discount_percent / 100.0)
        line_net = line_gross - line_discount_amt
        line_cost = product.cost * line_in.quantity
        
        # Risk assessment for this line
        limit = CATEGORY_DISCOUNT_LIMITS.get(product.category.lower(), 10.0)
        if line_in.discount_percent > limit:
            requires_approval = True
            explanations.append(f"{product.name} ({product.category}) discount of {line_in.discount_percent}% exceeds limit of {limit}%")
            
        line_margin = 0
        if line_net > 0:
            line_margin = ((line_net - line_cost) / line_net) * 100.0
            
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
            line_total=line_net,
            line_margin_percent=round(line_margin, 2)
        ))
        
    # Global metrics
    total = subtotal - total_discount
    margin_percentage = 0.0
    if total > 0:
        margin_percentage = ((total - estimated_cost) / total) * 100.0
        
    risk_score = "LOW"
    if requires_approval:
        risk_score = "HIGH"
    elif margin_percentage < 20.0:
        risk_score = "MEDIUM"
        
    return QuoteRecalculateResponse(
        subtotal=round(subtotal, 2),
        total_discount=round(total_discount, 2),
        total=round(total, 2),
        estimated_cost=round(estimated_cost, 2),
        margin_percentage=round(margin_percentage, 2),
        risk_score=risk_score,
        requires_approval=requires_approval,
        explanations=explanations,
        lines=lines_response
    )
