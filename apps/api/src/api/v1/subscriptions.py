from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.models.billing import Subscription, SubscriptionPlan, BillingScheduleItem
from src.models.customer import Customer

router = APIRouter()

@router.get("/plans")
def list_subscription_plans(db: Session = Depends(get_db)):
    return db.query(SubscriptionPlan).all()

@router.get("")
def list_subscriptions(db: Session = Depends(get_db)):
    subs = db.query(Subscription).all()
    results = []
    for s in subs:
        c = db.query(Customer).filter(Customer.id == s.customer_id).first()
        results.append({
            "id": s.id,
            "customer_id": s.customer_id,
            "customer_name": c.name if c else "Acme Customer",
            "status": s.status,
            "start_date": s.start_date,
            "lines_count": len(s.lines)
        })
    return results

@router.get("/{subscription_id}/schedule")
def get_subscription_schedule(subscription_id: str, db: Session = Depends(get_db)):
    items = db.query(BillingScheduleItem).filter(BillingScheduleItem.subscription_id == subscription_id).all()
    return items
