from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from src.api.deps import HEALTH_ROLES, get_db, RoleChecker
from src.models.user import User
from src.models.deal import Deal

router = APIRouter()

class DealHealthResponse(BaseModel):
    id: str
    deal_id: str
    customer_name: str
    health_score: int
    margin_health: str
    discount_risk: str
    inventory_risk: str
    engagement: str
    issues: List[str]

@router.get("/", response_model=List[DealHealthResponse])
def get_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(HEALTH_ROLES))
):
    deals = db.query(Deal).filter(Deal.status.in_(["draft", "negotiation", "approval"])).all()
    health_data = []
    
    for deal in deals:
        issues = []
        score = 100
        
        # Margin/Discount Risk
        margin_health = "Healthy"
        discount_risk = "Low"
        
        if deal.risk == "high":
            score -= 40
            discount_risk = "High"
            margin_health = "Poor"
            issues.append("High discount requested requiring executive approval.")
        elif deal.risk == "medium":
            score -= 20
            discount_risk = "Medium"
            margin_health = "Average"
            issues.append("Discount approaches ceiling.")
            
        if deal.status == "approval":
            score -= 10
            issues.append("Deal is stalled in approval phase.")
            
        # Inventory Risk Evaluation
        inv_risk = "Low"
        from src.models.quotation import Quotation, QuoteLine
        from src.models.operations import Stock
        from src.models.audit import AuditLog
        
        quote = db.query(Quotation).filter(Quotation.deal_id == deal.id).order_by(Quotation.created_at.desc()).first()
        if quote:
            for line in quote.lines:
                stocks = db.query(Stock).filter(Stock.product_id == line.product_id).all()
                total_avail = sum([max(0, s.quantity_on_hand - s.quantity_allocated) for s in stocks])
                if total_avail < line.quantity:
                    inv_risk = "High"
                    issues.append(f"Insufficient stock for item {line.product_id}")
                    score -= 15
                    break

        # Engagement Evaluation
        audit_count = db.query(AuditLog).filter(AuditLog.entity_id == deal.id).count()
        if audit_count > 3:
            engagement_status = "High"
        elif audit_count > 0:
            engagement_status = "Medium"
        else:
            engagement_status = "data_unavailable"

        health_data.append(DealHealthResponse(
            id=f"health-{deal.id}",
            deal_id=deal.id,
            customer_name=deal.customer.name if (deal.customer and hasattr(deal.customer, 'name')) else (getattr(deal, 'customer_name', 'Unknown') or "Unknown"),
            health_score=max(0, score),
            margin_health=margin_health,
            discount_risk=discount_risk,
            inventory_risk=inv_risk,
            engagement=engagement_status,
            issues=issues
        ))
        
    return health_data
