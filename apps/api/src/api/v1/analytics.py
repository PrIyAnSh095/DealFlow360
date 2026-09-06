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
    mom_revenue: float = 0.0
    mom_win_rate: float = 0.0
    mom_cycle_time: float = 0.0
    mom_discount: float = 0.0

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

@router.get("", response_model=AnalyticsDashboard)
@router.get("/", response_model=AnalyticsDashboard)
def get_analytics(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(ANALYTICS_ROLES))):
    # Total revenue (sum of paid invoices)
    total_rev_val = db.query(func.sum(Invoice.amount_paid)).scalar()
    total_rev = Decimal(str(total_rev_val)) if total_rev_val is not None else Decimal('0.0')
    
    # Win rate (case-insensitive)
    total_deals = db.query(Deal).count()
    won_deals = db.query(Deal).filter(func.lower(Deal.status) == "won").count()
    win_rate = (won_deals / total_deals * 100.0) if total_deals > 0 else 0.0
    
    # Active deals (case-insensitive)
    active_statuses = ["prospecting", "qualification", "proposal", "negotiation", "approval", "quotation", "new", "qualified"]
    active_deals = db.query(Deal).filter(func.lower(Deal.status).in_(active_statuses)).count()
    
    active_deals_query = db.query(Deal).filter(func.lower(Deal.status).in_(active_statuses))
    active_deal_rows = active_deals_query.all()
    now = datetime.now(timezone.utc)
    cycle_ages = [
        (now - as_utc(deal.created_at)).total_seconds() / 86400.0
        for deal in active_deal_rows
        if deal.created_at
    ]
    avg_cycle_time = sum(cycle_ages) / len(cycle_ages) if cycle_ages else 0.0
    
    # Average discount
    avg_disc_val = db.query(func.avg(Quotation.total_discount)).scalar() or 0.0
    avg_subtotal_val = db.query(func.avg(Quotation.subtotal)).scalar() or 1.0
    avg_disc = (avg_disc_val / avg_subtotal_val * 100.0) if avg_subtotal_val > 0 else 0.0
    
    overview = AnalyticsOverview(
        total_revenue=total_rev,
        win_rate=float(win_rate),
        avg_cycle_time_days=float(avg_cycle_time),
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
        month_subtotal = float(sum(float(quote.subtotal or 0.0) for quote in month_quotes))
        month_discount = float(sum(float(quote.total_discount or 0.0) for quote in month_quotes))
        revenue_trend.append(TrendPoint(
            label=month_start.strftime("%b"),
            value=float(sum(float(invoice.amount_paid or 0.0) for invoice in month_invoices)),
        ))
        discount_trend.append(TrendPoint(
            label=month_start.strftime("%b"),
            value=float((month_discount / month_subtotal) * 100.0) if month_subtotal > 0 else 0.0,
        ))

    mom_revenue = 0.0
    mom_discount = 0.0
    if len(revenue_trend) >= 2:
        curr = revenue_trend[-1].value
        prev = revenue_trend[-2].value
        if prev > 0:
            mom_revenue = ((curr - prev) / prev) * 100.0
        elif curr > 0:
            mom_revenue = 100.0

    if len(discount_trend) >= 2:
        curr = discount_trend[-1].value
        prev = discount_trend[-2].value
        if prev > 0:
            mom_discount = curr - prev

    prev_month_start = month_starts[-2] if len(month_starts) >= 2 else month_starts[0]
    curr_month_start = month_starts[-1] if len(month_starts) >= 1 else now
    
    prev_deals = db.query(Deal).filter(Deal.created_at >= prev_month_start, Deal.created_at < curr_month_start).all()
    curr_deals = db.query(Deal).filter(Deal.created_at >= curr_month_start).all()
    
    prev_won = sum(1 for d in prev_deals if (d.status or "").lower() == "won")
    curr_won = sum(1 for d in curr_deals if (d.status or "").lower() == "won")
    
    prev_win_rate = (prev_won / len(prev_deals)) * 100.0 if len(prev_deals) > 0 else 0.0
    curr_win_rate = (curr_won / len(curr_deals)) * 100.0 if len(curr_deals) > 0 else 0.0
    mom_win_rate = curr_win_rate - prev_win_rate
    
    prev_cycle_ages = [(as_utc(d.updated_at) - as_utc(d.created_at)).total_seconds() / 86400.0 for d in prev_deals if (d.status or "").lower() == "won" and d.updated_at]
    curr_cycle_ages = [(as_utc(d.updated_at) - as_utc(d.created_at)).total_seconds() / 86400.0 for d in curr_deals if (d.status or "").lower() == "won" and d.updated_at]
    
    prev_cycle_time = sum(prev_cycle_ages) / len(prev_cycle_ages) if prev_cycle_ages else 0.0
    curr_cycle_time = sum(curr_cycle_ages) / len(curr_cycle_ages) if curr_cycle_ages else 0.0
    mom_cycle_time = curr_cycle_time - prev_cycle_time
    
    overview.mom_revenue = float(mom_revenue)
    overview.mom_win_rate = float(mom_win_rate)
    overview.mom_cycle_time = float(mom_cycle_time)
    overview.mom_discount = float(mom_discount)
    
    return AnalyticsDashboard(
        overview=overview,
        revenue_trend=revenue_trend,
        discount_trend=discount_trend
    )
