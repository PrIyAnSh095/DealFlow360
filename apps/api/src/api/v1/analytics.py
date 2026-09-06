from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List
from decimal import Decimal
from datetime import datetime, timezone

from src.api.deps import ANALYTICS_ROLES, get_db, RoleChecker
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


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)

@router.get("/", response_model=AnalyticsDashboard)
def get_analytics(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(ANALYTICS_ROLES))):
    # Total revenue (sum of paid invoices)
    total_rev = db.query(func.sum(Invoice.amount_paid)).scalar() or Decimal('0.0')
    
    # Win rate
    total_deals = db.query(Deal).count()
    won_deals = db.query(Deal).filter(Deal.status == "won").count()
    win_rate = (won_deals / total_deals * 100) if total_deals > 0 else 0.0
    
    # Active deals
    active_deals = db.query(Deal).filter(Deal.status.in_(["prospecting", "qualification", "proposal", "negotiation", "approval"])).count()
    
    # Use the current age of active deals as the available cycle-time signal.
    active_deals_query = db.query(Deal).filter(Deal.status.in_(
        ["prospecting", "qualification", "proposal", "negotiation", "approval"]
    ))
    active_deal_rows = active_deals_query.all()
    now = datetime.now(timezone.utc)
    cycle_ages = [
        (now - as_utc(deal.created_at)).total_seconds() / 86400
        for deal in active_deal_rows
        if deal.created_at
    ]
    avg_cycle_time = sum(cycle_ages) / len(cycle_ages) if cycle_ages else 0.0
    
    # Average discount
    avg_disc = db.query(func.avg(Quotation.margin_percentage)).scalar() or 0.0
    
    overview = AnalyticsOverview(
        total_revenue=total_rev,
        win_rate=win_rate,
        avg_cycle_time_days=avg_cycle_time,
        avg_discount=float(avg_disc),
        active_deals=active_deals
    )
    
    month_starts = []
    month_cursor = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    for _ in range(5, -1, -1):
        month = month_cursor.month - _
        year = month_cursor.year + (month - 1) // 12
        month_starts.append(datetime(year, ((month - 1) % 12) + 1, 1, tzinfo=timezone.utc))

    invoices = db.query(Invoice).all()
    quotations = db.query(Quotation).all()
    revenue_trend = []
    discount_trend = []
    for index, month_start in enumerate(month_starts):
        next_month = month_starts[index + 1] if index + 1 < len(month_starts) else now
        month_invoices = [
            invoice for invoice in invoices
            if invoice.created_at and month_start <= as_utc(invoice.created_at) < next_month
        ]
        month_quotes = [
            quote for quote in quotations
            if quote.created_at and month_start <= as_utc(quote.created_at) < next_month
        ]
        month_subtotal = sum((quote.subtotal or Decimal("0")) for quote in month_quotes)
        month_discount = sum((quote.total_discount or Decimal("0")) for quote in month_quotes)
        revenue_trend.append(TrendPoint(
            label=month_start.strftime("%b"),
            value=float(sum((invoice.amount_paid or Decimal("0")) for invoice in month_invoices)),
        ))
        discount_trend.append(TrendPoint(
            label=month_start.strftime("%b"),
            value=float((month_discount / month_subtotal) * 100) if month_subtotal else 0.0,
        ))
    
    return AnalyticsDashboard(
        overview=overview,
        revenue_trend=revenue_trend,
        discount_trend=discount_trend
    )
