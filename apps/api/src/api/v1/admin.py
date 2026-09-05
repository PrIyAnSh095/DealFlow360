from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from src.api.deps import get_db, get_current_user
from src.models.user import User
from src.models.admin import PricingRule, SubscriptionPlan, GlobalSetting
from src.models.product import Product
from src.schemas.admin import (
    PricingRuleCreate, PricingRuleUpdate, PricingRuleResponse,
    SubscriptionPlanCreate, SubscriptionPlanUpdate, SubscriptionPlanResponse,
    GlobalSettingCreate, GlobalSettingUpdate, GlobalSettingResponse
)
from src.schemas.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter()

# --- PRICING RULES ---
@router.get("/pricing-rules", response_model=List[PricingRuleResponse])
def get_pricing_rules(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(PricingRule).all()

@router.post("/pricing-rules", response_model=PricingRuleResponse, status_code=status.HTTP_201_CREATED)
def create_pricing_rule(rule: PricingRuleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_rule = PricingRule(**rule.model_dump())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.patch("/pricing-rules/{rule_id}", response_model=PricingRuleResponse)
def update_pricing_rule(rule_id: str, rule: PricingRuleUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_rule = db.query(PricingRule).filter(PricingRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Pricing rule not found")
    
    update_data = rule.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_rule, field, value)
        
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.delete("/pricing-rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pricing_rule(rule_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_rule = db.query(PricingRule).filter(PricingRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Pricing rule not found")
    db.delete(db_rule)
    db.commit()

# --- SUBSCRIPTION PLANS ---
@router.get("/subscription-plans", response_model=List[SubscriptionPlanResponse])
def get_subscription_plans(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(SubscriptionPlan).all()

@router.post("/subscription-plans", response_model=SubscriptionPlanResponse, status_code=status.HTTP_201_CREATED)
def create_subscription_plan(plan: SubscriptionPlanCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_plan = SubscriptionPlan(**plan.model_dump())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.patch("/subscription-plans/{plan_id}", response_model=SubscriptionPlanResponse)
def update_subscription_plan(plan_id: str, plan: SubscriptionPlanUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Subscription plan not found")
    
    update_data = plan.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_plan, field, value)
        
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.delete("/subscription-plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subscription_plan(plan_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Subscription plan not found")
    db.delete(db_plan)
    db.commit()

# --- SETTINGS ---
@router.get("/settings", response_model=List[GlobalSettingResponse])
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(GlobalSetting).all()

@router.post("/settings", response_model=GlobalSettingResponse, status_code=status.HTTP_201_CREATED)
def create_setting(setting: GlobalSettingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_setting = GlobalSetting(**setting.model_dump())
    db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting

@router.patch("/settings/{key}", response_model=GlobalSettingResponse)
def update_setting(key: str, setting: GlobalSettingUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_setting = db.query(GlobalSetting).filter(GlobalSetting.key == key).first()
    if not db_setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    update_data = setting.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_setting, field, value)
        
    db.commit()
    db.refresh(db_setting)
    return db_setting

# --- PRODUCTS (Admin CRUD) ---
@router.get("/products", response_model=List[ProductResponse])
def get_all_products(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Product).all()

@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_prod = Product(**product.model_dump())
    db.add(db_prod)
    db.commit()
    db.refresh(db_prod)
    return db_prod

@router.patch("/products/{product_id}", response_model=ProductResponse)
def update_product(product_id: str, product: ProductUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_prod = db.query(Product).filter(Product.id == product_id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail="Product not found")
        
    update_data = product.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_prod, field, value)
        
    db.commit()
    db.refresh(db_prod)
    return db_prod
