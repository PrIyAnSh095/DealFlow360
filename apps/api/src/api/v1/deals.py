from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from src.core.database import get_db
from src.models.deal import Deal
from src.services.deal_health_service import calculate_deal_health

router = APIRouter()

class DealCreateInput(BaseModel):
    customer_name: str
    value: float
    status: str = "draft"
    risk: str = "low"

@router.get("")
def list_deals(db: Session = Depends(get_db)):
    return db.query(Deal).all()

@router.post("")
def create_deal(payload: DealCreateInput, db: Session = Depends(get_db)):
    deal = Deal(
        customer_name=payload.customer_name,
        value=payload.value,
        status=payload.status,
        risk=payload.risk
    )
    db.add(deal)
    db.commit()
    db.refresh(deal)
    return deal

@router.get("/{deal_id}")
def get_deal(deal_id: str, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return deal

@router.get("/{deal_id}/health")
def get_deal_health_endpoint(deal_id: str, db: Session = Depends(get_db)):
    return calculate_deal_health(db, deal_id)
