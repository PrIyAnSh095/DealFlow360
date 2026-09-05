from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List
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
            
    return DashboardMetrics(
        revenue_pipeline=revenue_pipeline,
        pipeline_growth_percent=12.0, # Mock growth for now
        deals_at_risk=deals_at_risk,
        pending_approvals=pending_approvals,
        pending_approval_value=pending_approval_value,
        open_deals=open_deals
    )

@router.get("/activities", response_model=List[ActivityLog])
def get_recent_activities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch recent audit logs or deal changes.
    # For now, we will query ApprovalAuditLog and format them.
    # Since we need generic activities, we'll construct them from deals created and approvals.
    
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
        
    return activities[:5]
