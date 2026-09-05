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
            
        health_data.append(DealHealthResponse(
            id=f"health-{deal.id}",
            deal_id=deal.id,
            customer_name=deal.customer.name if deal.customer else "Unknown",
            health_score=max(0, score),
            margin_health=margin_health,
            discount_risk=discount_risk,
            inventory_risk="Not tracked",
            engagement="Not tracked",
            issues=issues
        ))
        
    return health_data
