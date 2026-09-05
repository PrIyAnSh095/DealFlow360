from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, Body, HTTPException
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.models.product import Product
from src.models.pricing import Category, PriceList, DiscountPolicy, ApprovalRule
from src.models.customer import CustomerTier, Customer
from src.models.operations import Warehouse
from src.models.user import User
from src.models.audit import AuditEvent
from src.models.ai_config import CompanyAIConfig
from src.services.audit_service import log_audit_event

router = APIRouter()

@router.get("/ai-config")
def get_ai_config(db: Session = Depends(get_db)):
    config = db.query(CompanyAIConfig).filter(CompanyAIConfig.id == "default-config").first()
    if not config:
        config = CompanyAIConfig(id="default-config")
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@router.put("/ai-config")
def update_ai_config(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    config = db.query(CompanyAIConfig).filter(CompanyAIConfig.id == "default-config").first()
    if not config:
        config = CompanyAIConfig(id="default-config")
        db.add(config)

    for key, value in payload.items():
        if hasattr(config, key) and key != "id":
            setattr(config, key, value)

    db.commit()
    db.refresh(config)

    log_audit_event(
        db,
        user_id="admin",
        action="AI_CONFIG_UPDATED",
        entity_type="CompanyAIConfig",
        entity_id="default-config",
        details="Updated Company AI data privacy consent settings"
    )

    return config

@router.get("/products")
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).all()

@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@router.get("/customer-tiers")
def list_customer_tiers(db: Session = Depends(get_db)):
    return db.query(CustomerTier).all()

@router.get("/customers")
def list_customers(db: Session = Depends(get_db)):
    return db.query(Customer).all()

@router.get("/warehouses")
def list_warehouses(db: Session = Depends(get_db)):
    return db.query(Warehouse).all()

@router.get("/sales-reps")
def list_sales_reps(db: Session = Depends(get_db)):
    return db.query(User).filter(User.role.in_(["sales", "sales_rep", "manager", "sales_manager"])).all()

@router.get("/discount-policies")
def list_discount_policies(db: Session = Depends(get_db)):
    return db.query(DiscountPolicy).all()

@router.get("/approval-rules")
def list_approval_rules(db: Session = Depends(get_db)):
    return db.query(ApprovalRule).all()

@router.get("/audit-logs")
def list_audit_logs(
    action: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(AuditEvent)
    if action:
        query = query.filter(AuditEvent.action == action)
    if user_id:
        query = query.filter(AuditEvent.user_id == user_id)
    
    total = query.count()
    events = query.order_by(AuditEvent.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "events": events
    }

