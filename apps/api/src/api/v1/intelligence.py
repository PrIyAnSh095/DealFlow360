from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from src.api.deps import get_db, get_current_user
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
    current_user: User = Depends(get_current_user)
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
    for line in quotation.lines:
        if line.discount_percent > Decimal('15.0'):
            has_high_discount = True
            
    if quotation.risk_score == "HIGH" or has_high_discount:
        recommendations.append(
            DealRescueRecommendation(
                id="rec-1",
                title="Reduce excessive discount",
                description="Line item discount exceeds 15%. Reducing to 12% will bypass manager approval.",
                impact_revenue="+$450.00",
                impact_margin="+2.5%",
                impact_risk="Drops to LOW",
                action_type="discount_adjustment"
            )
        )
        
    if quotation.margin_percentage < Decimal('20.0'):
        recommendations.append(
            DealRescueRecommendation(
                id="rec-2",
                title="Include High-Margin Setup Service",
                description="Adding standard setup service improves blended margin above the 20% warning threshold.",
                impact_revenue="+$1,200.00",
                impact_margin="+4.2%",
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
                impact_revenue="+$0.00",
                impact_margin="-0.5%",
                impact_risk="Improves closing probability",
                action_type="fulfillment_change"
            )
        )
        
    return recommendations
