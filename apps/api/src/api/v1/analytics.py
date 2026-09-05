from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Dict, Any
from decimal import Decimal

from src.api.deps import get_db, get_current_user
from src.models.user import User
from src.models.deal import Deal
from src.models.quotation import Quotation
from src.models.billing import Invoice

router = APIRouter()

class AnalyticsOverview(BaseModel):
    total_revenue: Decimal
    win_rate: float
    avg_cycle_time_days: float
    avg_discount: float
    active_deals: int

class TrendPoint(BaseModel):
    label: str
    value: float

class AnalyticsDashboard(BaseModel):
    overview: AnalyticsOverview
    revenue_trend: List[TrendPoint]
    discount_trend: List[TrendPoint]

@router.get("/", response_model=AnalyticsDashboard)
def get_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Total revenue (sum of paid invoices)
    total_rev = db.query(func.sum(Invoice.amount_paid)).scalar() or Decimal('0.0')
    
    # Win rate
    total_deals = db.query(Deal).count()
    won_deals = db.query(Deal).filter(Deal.status == "won").count()
    win_rate = (won_deals / total_deals * 100) if total_deals > 0 else 0.0
    
    # Active deals
    active_deals = db.query(Deal).filter(Deal.status.in_(["prospecting", "qualification", "proposal", "negotiation", "approval"])).count()
    
    # Average cycle time
    # In a real app we'd diff created_at and won_at. Mock for now:
    avg_cycle_time = 24.5
    
    # Average discount
    avg_disc = db.query(func.avg(Quotation.margin_percentage)).scalar() or 0.0
    
    overview = AnalyticsOverview(
        total_revenue=total_rev,
        win_rate=win_rate,
        avg_cycle_time_days=avg_cycle_time,
        avg_discount=float(avg_disc),
        active_deals=active_deals
    )
    
    # Mock trends
    revenue_trend = [
        TrendPoint(label="Jan", value=125000),
        TrendPoint(label="Feb", value=142000),
        TrendPoint(label="Mar", value=98000),
        TrendPoint(label="Apr", value=176000),
        TrendPoint(label="May", value=210000),
        TrendPoint(label="Jun", value=float(total_rev)),
    ]
    
    discount_trend = [
        TrendPoint(label="Jan", value=12.5),
        TrendPoint(label="Feb", value=14.2),
        TrendPoint(label="Mar", value=15.8),
        TrendPoint(label="Apr", value=11.2),
        TrendPoint(label="May", value=10.5),
        TrendPoint(label="Jun", value=9.8),
    ]
    
    return AnalyticsDashboard(
        overview=overview,
        revenue_trend=revenue_trend,
        discount_trend=discount_trend
    )
