from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import datetime, timedelta

from src.api.deps import get_db, get_current_user
from src.models.user import User
from src.models.deal import Deal
from src.models.approval import ApprovalAuditLog

router = APIRouter()

class DashboardMetrics(BaseModel):
    revenue_pipeline: Decimal
    pipeline_growth_percent: float
    deals_at_risk: int
    pending_approvals: int
    pending_approval_value: Decimal
    open_deals: int
    
    # Admin metrics
    total_users: Optional[int] = None
    active_customers: Optional[int] = None
    total_products: Optional[int] = None
    active_subscriptions: Optional[int] = None

class ActivityLog(BaseModel):
    id: str
    action_by: str
    initials: str
    action_type: str
    target_name: str
    timestamp: str
    color_hint: str

@router.get("/metrics", response_model=DashboardMetrics)
def get_dashboard_metrics(
    period: Optional[str] = "30d",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    days_map = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
        "365d": 365,
    }
    days = days_map.get(period, 30) if period != "all" else None
    now = datetime.now()

    if period == "all" or days is None:
        deals = db.query(Deal).all()
        current_period_deals = deals
        previous_period_deals = []
    else:
        period_start = now - timedelta(days=days)
        prev_period_start = now - timedelta(days=days * 2)
        deals = db.query(Deal).filter(Deal.created_at >= period_start).all()
        current_period_deals = deals
        previous_period_deals = db.query(Deal).filter(
            Deal.created_at >= prev_period_start,
            Deal.created_at < period_start
        ).all()

    revenue_pipeline = Decimal('0.0')
    deals_at_risk = 0
    pending_approvals = 0
    pending_approval_value = Decimal('0.0')
    open_deals = 0
    
    for deal in deals:
        if deal.status not in ["completed", "lost"]:
            open_deals += 1
            revenue_pipeline += deal.value
            
        if deal.risk == "HIGH" or deal.risk == "high":
            deals_at_risk += 1
            
        if deal.status == "approval":
            pending_approvals += 1
            pending_approval_value += deal.value
            
    current_revenue = sum([d.value for d in current_period_deals if d.status not in ["completed", "lost"]])
    prev_revenue = sum([d.value for d in previous_period_deals if d.status not in ["completed", "lost"]])
    
    growth = 0.0
    if prev_revenue > 0:
        growth = float(((current_revenue - prev_revenue) / prev_revenue) * 100)
    elif current_revenue > 0:
        growth = 100.0

    response = DashboardMetrics(
        revenue_pipeline=revenue_pipeline,
        pipeline_growth_percent=round(growth, 1),
        deals_at_risk=deals_at_risk,
        pending_approvals=pending_approvals,
        pending_approval_value=pending_approval_value,
        open_deals=open_deals
    )
    
    if current_user.role == "admin":
        response.total_users = db.query(User).count()
        response.active_customers = db.query(User).filter(User.role == "customer", User.is_active == True).count()
        from src.models.product import Product
        response.total_products = db.query(Product).count()
        from src.models.billing import Subscription
        response.active_subscriptions = db.query(Subscription).filter(Subscription.status == "active").count()
        
    return response

@router.get("/activities", response_model=List[ActivityLog])
def get_recent_activities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    activities = []
    
    # Get last 5 deals created
    recent_deals = db.query(Deal).order_by(Deal.created_at.desc()).limit(5).all()
    for deal in recent_deals:
        # Fetch user who owns the deal
        owner = db.query(User).filter(User.id == deal.owner_id).first() if hasattr(deal, 'owner_id') else None
        actor_name = owner.name if owner else "System"
        initials = "".join([n[0] for n in actor_name.split()[:2]]) if owner else "SYS"

        activities.append(ActivityLog(
            id=f"deal-{deal.id}",
            action_by=actor_name,
            initials=initials,
            action_type="created deal",
            target_name=deal.name if hasattr(deal, 'name') else f"Deal {deal.id[:8]}",
            timestamp=deal.created_at.isoformat(),
            color_hint="primary"
        ))
        
    # Get last 5 approval audit logs
    recent_approvals = db.query(ApprovalAuditLog).order_by(ApprovalAuditLog.created_at.desc()).limit(5).all()
    for log in recent_approvals:
        user = db.query(User).filter(User.id == log.actor_id).first()
        actor_name = user.name if user else "System"
        initials = "".join([n[0] for n in actor_name.split()[:2]]) if user else "SYS"
        
        color_hint = "primary"
        if log.action == "APPROVED":
            color_hint = "success"
        elif log.action == "REJECTED":
            color_hint = "danger"
        elif log.action == "RETURNED":
            color_hint = "warning"
            
        activities.append(ActivityLog(
            id=f"audit-{log.id}",
            action_by=actor_name,
            initials=initials,
            action_type=f"{log.action.lower()} quotation",
            target_name=f"Req {log.approval_request_id[:8]}",
            timestamp=log.created_at.isoformat(),
            color_hint=color_hint
        ))
        
    # Sort activities by timestamp descending
    activities.sort(key=lambda x: x.timestamp, reverse=True)
    return activities[:10]
