from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from src.api.deps import RESCUE_ROLES, get_db, RoleChecker
from src.models.user import User
from src.models.deal import Deal
from src.models.quotation import Quotation, QuoteLine
from src.models.product import Product
from decimal import Decimal

router = APIRouter()

class DealRescueRecommendation(BaseModel):
    id: str
    title: str
    description: str
    impact_revenue: str
    impact_margin: str
    impact_risk: str
    action_type: str

@router.get("/deals/{deal_id}/rescue", response_model=List[DealRescueRecommendation])
def get_deal_rescue(
    deal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(RESCUE_ROLES))
):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
        
    quotation = db.query(Quotation).filter(Quotation.deal_id == deal.id).order_by(Quotation.created_at.desc()).first()
    
    recommendations = []
    
    if not quotation:
        return recommendations
        
    # Analyze quotation lines to find high discounts
    has_high_discount = False
    excess_discount_revenue = Decimal('0.0')
    
    total_revenue = quotation.total_amount or Decimal('1.0')
    old_margin = quotation.margin_percentage or Decimal('0.0')
    
    for line in quotation.lines:
        if line.discount_percent and line.discount_percent > Decimal('15.0'):
            has_high_discount = True
            # if reduced to 12%
            diff_percent = line.discount_percent - Decimal('12.0')
            excess_discount_revenue += (diff_percent / Decimal('100.0')) * (line.unit_price * line.quantity)
            
    if quotation.risk_score == "HIGH" or has_high_discount:
        new_margin = old_margin + (excess_discount_revenue / total_revenue) * Decimal('100.0') if total_revenue > 0 else old_margin
        margin_diff = new_margin - old_margin
        
        recommendations.append(
            DealRescueRecommendation(
                id="rec-1",
                title="Reduce excessive discount",
                description="Line item discount exceeds 15%. Reducing to 12% will bypass manager approval.",
                impact_revenue=f"+₹{excess_discount_revenue:,.2f}",
                impact_margin=f"+{margin_diff:,.1f}%",
                impact_risk="Drops to LOW",
                action_type="discount_adjustment"
            )
        )
        
    if quotation.margin_percentage is not None and quotation.margin_percentage < Decimal('20.0'):
        # Propose adding a $1200 service with 80% margin
        service_rev = Decimal('1200.00')
        service_cost = Decimal('240.00')
        old_cost = total_revenue - (total_revenue * old_margin / Decimal('100.0'))
        new_rev = total_revenue + service_rev
        new_cost = old_cost + service_cost
        new_margin_calc = ((new_rev - new_cost) / new_rev) * Decimal('100.0') if new_rev > 0 else Decimal('0.0')
        margin_impact = new_margin_calc - old_margin
        
        recommendations.append(
            DealRescueRecommendation(
                id="rec-2",
                title="Include High-Margin Setup Service",
                description="Adding standard setup service improves blended margin above the 20% warning threshold.",
                impact_revenue=f"+₹{service_rev:,.2f}",
                impact_margin=f"+{margin_impact:,.1f}%",
                impact_risk="Unchanged",
                action_type="cross_sell"
            )
        )
        
    if not recommendations and quotation.status == "approval":
        recommendations.append(
            DealRescueRecommendation(
                id="rec-3",
                title="Expedite Fulfillment Option",
                description="Offer priority shipping to secure deal confirmation faster while awaiting approval.",
                impact_revenue="+₹0.00",
                impact_margin="-0.5%",
                impact_risk="Improves closing probability",
                action_type="fulfillment_change"
            )
        )
        
    return recommendations
