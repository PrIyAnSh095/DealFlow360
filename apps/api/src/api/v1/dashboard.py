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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Base query for deals (assuming all deals for now, could be filtered by owner)
    deals = db.query(Deal).all()
    
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
            
    response = DashboardMetrics(
        revenue_pipeline=revenue_pipeline,
        pipeline_growth_percent=12.0, # Mock growth for now
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
        activities.append(ActivityLog(
            id=f"deal-{deal.id}",
            action_by="System",
            initials="SYS",
            action_type="created deal",
            target_name=f"Deal {deal.id[:8]}",
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
