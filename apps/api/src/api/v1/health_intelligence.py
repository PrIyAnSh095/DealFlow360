from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.services.deal_health_service import get_all_deal_health_metrics, calculate_deal_health
from src.models.audit import AuditEvent

router = APIRouter()

@router.get("/deal-health")
def get_deal_health(db: Session = Depends(get_db)):
    return get_all_deal_health_metrics(db)

@router.get("/deal-health/{deal_id}")
def get_single_deal_health(deal_id: str, db: Session = Depends(get_db)):
    return calculate_deal_health(db, deal_id)

@router.get("/audit-events")
def list_audit_events(db: Session = Depends(get_db)):
    return db.query(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(100).all()
