from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query, Body, HTTPException, status
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.api.deps import RoleChecker
from src.models.product import Product
from src.models.pricing import PriceList
from src.models.customer import CustomerTier, Customer
from src.models.operations import Warehouse
from src.models.user import User
from src.models.audit import AuditEvent, AuditLog
from src.models.ai_config import CompanyAIConfig
from src.models.admin import (
    PricingRule, SubscriptionPlan, GlobalSetting, ApprovalChain,
    Category, DiscountPolicy, ApprovalRule
)
from src.schemas.admin import (
    PricingRuleCreate, PricingRuleUpdate, PricingRuleResponse,
    SubscriptionPlanCreate, SubscriptionPlanUpdate, SubscriptionPlanResponse,
    GlobalSettingCreate, GlobalSettingUpdate, GlobalSettingResponse,
    AdminUserCreate, AdminUserUpdate, AuditLogResponse,
    CategoryCreate, CategoryUpdate, CategoryResponse,
    CustomerTierCreate, CustomerTierUpdate, CustomerTierResponse,
    DiscountPolicyCreate, DiscountPolicyUpdate, DiscountPolicyResponse,
    ApprovalRuleCreate, ApprovalRuleUpdate, ApprovalRuleResponse,
    ApprovalChainCreate, ApprovalChainUpdate, ApprovalChainResponse
)
from src.schemas.user import UserResponse
from src.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from src.core.security import get_password_hash
from src.models.organization import OrganizationProfile
from src.services.audit_service import log_audit_event

router = APIRouter()

@router.get("/organization")
def get_organization_profile(db: Session = Depends(get_db)):
    org = db.query(OrganizationProfile).filter(OrganizationProfile.id == "org-default").first()
    if not org:
        org = OrganizationProfile(id="org-default")
        db.add(org)
        db.commit()
        db.refresh(org)
    return org

@router.post("/organization/onboarding")
def complete_organization_onboarding(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    org = db.query(OrganizationProfile).filter(OrganizationProfile.id == "org-default").first()
    if not org:
        org = OrganizationProfile(id="org-default")
        db.add(org)

    for key, value in payload.items():
        if hasattr(org, key) and key != "id":
            setattr(org, key, value)

    org.onboarding_completed = True
    db.commit()
    db.refresh(org)

    log_audit_event(
        db,
        user_id="admin",
        action="ORGANIZATION_ONBOARDING_COMPLETED",
        entity_type="OrganizationProfile",
        entity_id="org-default",
        details="Organization Admin completed multi-step onboarding and AI policy configuration"
    )

    return org
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

# --- PRICING RULES ---
@router.get("/pricing-rules", response_model=List[PricingRuleResponse])
def get_pricing_rules(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    return db.query(PricingRule).all()

@router.post("/pricing-rules", response_model=PricingRuleResponse, status_code=status.HTTP_201_CREATED)
def create_pricing_rule(rule: PricingRuleCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_rule = PricingRule(**rule.model_dump())
    db.add(db_rule)
    db.add(AuditLog(actor_id=str(current_user.id), action="CREATE_PRICING_RULE", entity_type="PRICING_RULE", details=rule.model_dump()))
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.patch("/pricing-rules/{rule_id}", response_model=PricingRuleResponse)
def update_pricing_rule(rule_id: str, rule: PricingRuleUpdate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_rule = db.query(PricingRule).filter(PricingRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Pricing rule not found")
    
    update_data = rule.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_rule, field, value)
        
    db.add(AuditLog(actor_id=str(current_user.id), action="UPDATE_PRICING_RULE", entity_type="PRICING_RULE", entity_id=rule_id, details=update_data))
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.delete("/pricing-rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pricing_rule(rule_id: str, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_rule = db.query(PricingRule).filter(PricingRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Pricing rule not found")
    db.delete(db_rule)
    db.add(AuditLog(actor_id=str(current_user.id), action="DELETE_PRICING_RULE", entity_type="PRICING_RULE", entity_id=rule_id))
    db.commit()

# --- SUBSCRIPTION PLANS ---
@router.get("/subscription-plans", response_model=List[SubscriptionPlanResponse])
def get_subscription_plans(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    return db.query(SubscriptionPlan).all()

@router.post("/subscription-plans", response_model=SubscriptionPlanResponse, status_code=status.HTTP_201_CREATED)
def create_subscription_plan(plan: SubscriptionPlanCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_plan = SubscriptionPlan(**plan.model_dump())
    db.add(db_plan)
    db.add(AuditLog(actor_id=str(current_user.id), action="CREATE_SUBSCRIPTION_PLAN", entity_type="SUBSCRIPTION_PLAN", details=plan.model_dump()))
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.patch("/subscription-plans/{plan_id}", response_model=SubscriptionPlanResponse)
def update_subscription_plan(plan_id: str, plan: SubscriptionPlanUpdate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Subscription plan not found")
    
    update_data = plan.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_plan, field, value)
        
    db.add(AuditLog(actor_id=str(current_user.id), action="UPDATE_SUBSCRIPTION_PLAN", entity_type="SUBSCRIPTION_PLAN", entity_id=plan_id, details=update_data))
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.delete("/subscription-plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subscription_plan(plan_id: str, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Subscription plan not found")
    db.delete(db_plan)
    db.add(AuditLog(actor_id=str(current_user.id), action="DELETE_SUBSCRIPTION_PLAN", entity_type="SUBSCRIPTION_PLAN", entity_id=plan_id))
    db.commit()

# --- SETTINGS ---
@router.get("/settings", response_model=List[GlobalSettingResponse])
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    return db.query(GlobalSetting).all()

@router.post("/settings", response_model=GlobalSettingResponse, status_code=status.HTTP_201_CREATED)
def create_setting(setting: GlobalSettingCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_setting = GlobalSetting(**setting.model_dump())
    db.add(db_setting)
    db.add(AuditLog(actor_id=str(current_user.id), action="CREATE_GLOBAL_SETTING", entity_type="GLOBAL_SETTING", details=setting.model_dump()))
    db.commit()
    db.refresh(db_setting)
    return db_setting

@router.patch("/settings/{key}", response_model=GlobalSettingResponse)
def update_setting(key: str, setting: GlobalSettingUpdate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_setting = db.query(GlobalSetting).filter(GlobalSetting.key == key).first()
    if not db_setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    update_data = setting.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_setting, field, value)
        
    db.add(AuditLog(actor_id=str(current_user.id), action="UPDATE_GLOBAL_SETTING", entity_type="GLOBAL_SETTING", entity_id=key, details=update_data))
    db.commit()
    db.refresh(db_setting)
    return db_setting

# --- PRODUCTS (Admin CRUD) ---
@router.get("/products", response_model=List[ProductResponse])
def get_all_products(db: Session = Depends(get_db)):
    return db.query(Product).all()

@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_prod = Product(**product.model_dump())
    db.add(db_prod)
    db.add(AuditLog(actor_id=str(current_user.id), action="CREATE_PRODUCT", entity_type="PRODUCT", details=product.model_dump()))
    db.commit()
    db.refresh(db_prod)
    return db_prod

@router.patch("/products/{product_id}", response_model=ProductResponse)
def update_product(product_id: str, product: ProductUpdate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_prod = db.query(Product).filter(Product.id == product_id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail="Product not found")
        
    update_data = product.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_prod, field, value)
        
    db.add(AuditLog(actor_id=str(current_user.id), action="UPDATE_PRODUCT", entity_type="PRODUCT", entity_id=product_id, details=update_data))
    db.commit()
    db.refresh(db_prod)
    return db_prod

# --- USERS (Admin CRUD) ---
@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_admin_user(user_in: AdminUserCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    if db.query(User).filter(User.email == user_in.email.lower()).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = User(
        name=user_in.name,
        email=user_in.email.lower(),
        password_hash=get_password_hash(user_in.password),
        role=user_in.role,
        is_active=user_in.is_active,
        company=user_in.company,
        tier=user_in.tier
    )
    db.add(db_user)
    
    db.add(AuditLog(actor_id=str(current_user.id), action="CREATE_USER", entity_type="USER", details={"email": user_in.email, "role": user_in.role}))
    
    db.commit()
    db.refresh(db_user)
    return db_user

@router.patch("/users/{user_id}", response_model=UserResponse)
def update_admin_user(user_id: str, user_in: AdminUserUpdate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user_in.model_dump(exclude_unset=True)
    if "email" in update_data:
        update_data["email"] = update_data["email"].lower()
    
    for field, value in update_data.items():
        if getattr(db_user, field) != value:
            setattr(db_user, field, value)
        
    db.add(AuditLog(actor_id=str(current_user.id), action="UPDATE_USER", entity_type="USER", entity_id=user_id, details=update_data))
    
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_admin_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db_user.is_active = False
    
    db.add(AuditLog(actor_id=str(current_user.id), action="DEACTIVATE_USER", entity_type="USER", entity_id=user_id))
    
    db.commit()

# --- AUDIT LOGS ---
@router.get("/audit-logs")
def get_audit_logs(
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

# --- CATEGORIES ---
@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(category: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_cat = Category(**category.model_dump())
    db.add(db_cat)
    db.add(AuditLog(actor_id=str(current_user.id), action="CREATE_CATEGORY", entity_type="CATEGORY", details=category.model_dump()))
    db.commit()
    db.refresh(db_cat)
    return db_cat

@router.patch("/categories/{cat_id}", response_model=CategoryResponse)
def update_category(cat_id: str, category: CategoryUpdate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_cat = db.query(Category).filter(Category.id == cat_id).first()
    if not db_cat:
        raise HTTPException(404, "Category not found")
    update_data = category.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(db_cat, k, v)
    db.add(AuditLog(actor_id=str(current_user.id), action="UPDATE_CATEGORY", entity_type="CATEGORY", entity_id=cat_id, details=update_data))
    db.commit()
    db.refresh(db_cat)
    return db_cat

@router.delete("/categories/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(cat_id: str, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_cat = db.query(Category).filter(Category.id == cat_id).first()
    if not db_cat:
        raise HTTPException(404, "Category not found")
    db.delete(db_cat)
    db.add(AuditLog(actor_id=str(current_user.id), action="DELETE_CATEGORY", entity_type="CATEGORY", entity_id=cat_id))
    db.commit()

# --- CUSTOMER TIERS ---
@router.get("/customer-tiers")
def get_customer_tiers(db: Session = Depends(get_db)):
    return db.query(CustomerTier).all()

@router.post("/customer-tiers", response_model=CustomerTierResponse, status_code=status.HTTP_201_CREATED)
def create_customer_tier(tier: CustomerTierCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_tier = CustomerTier(**tier.model_dump())
    db.add(db_tier)
    db.add(AuditLog(actor_id=str(current_user.id), action="CREATE_CUSTOMER_TIER", entity_type="CUSTOMER_TIER", details=tier.model_dump()))
    db.commit()
    db.refresh(db_tier)
    return db_tier

@router.patch("/customer-tiers/{tier_id}", response_model=CustomerTierResponse)
def update_customer_tier(tier_id: str, tier: CustomerTierUpdate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_tier = db.query(CustomerTier).filter(CustomerTier.id == tier_id).first()
    if not db_tier:
        raise HTTPException(404, "Tier not found")
    update_data = tier.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(db_tier, k, v)
    db.add(AuditLog(actor_id=str(current_user.id), action="UPDATE_CUSTOMER_TIER", entity_type="CUSTOMER_TIER", entity_id=tier_id, details=update_data))
    db.commit()
    db.refresh(db_tier)
    return db_tier

@router.delete("/customer-tiers/{tier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer_tier(tier_id: str, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_tier = db.query(CustomerTier).filter(CustomerTier.id == tier_id).first()
    if not db_tier:
        raise HTTPException(404, "Tier not found")
    db.delete(db_tier)
    db.add(AuditLog(actor_id=str(current_user.id), action="DELETE_CUSTOMER_TIER", entity_type="CUSTOMER_TIER", entity_id=tier_id))
    db.commit()

# --- DISCOUNT POLICIES ---
@router.get("/discount-policies")
def get_discount_policies(db: Session = Depends(get_db)):
    return db.query(DiscountPolicy).all()

@router.post("/discount-policies", response_model=DiscountPolicyResponse, status_code=status.HTTP_201_CREATED)
def create_discount_policy(policy: DiscountPolicyCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_policy = DiscountPolicy(**policy.model_dump())
    db.add(db_policy)
    db.add(AuditLog(actor_id=str(current_user.id), action="CREATE_DISCOUNT_POLICY", entity_type="DISCOUNT_POLICY", details=policy.model_dump()))
    db.commit()
    db.refresh(db_policy)
    return db_policy

@router.patch("/discount-policies/{policy_id}", response_model=DiscountPolicyResponse)
def update_discount_policy(policy_id: str, policy: DiscountPolicyUpdate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_policy = db.query(DiscountPolicy).filter(DiscountPolicy.id == policy_id).first()
    if not db_policy:
        raise HTTPException(404, "Policy not found")
    update_data = policy.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(db_policy, k, v)
    db.add(AuditLog(actor_id=str(current_user.id), action="UPDATE_DISCOUNT_POLICY", entity_type="DISCOUNT_POLICY", entity_id=policy_id, details=update_data))
    db.commit()
    db.refresh(db_policy)
    return db_policy

@router.delete("/discount-policies/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_discount_policy(policy_id: str, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_policy = db.query(DiscountPolicy).filter(DiscountPolicy.id == policy_id).first()
    if not db_policy:
        raise HTTPException(404, "Policy not found")
    db.delete(db_policy)
    db.add(AuditLog(actor_id=str(current_user.id), action="DELETE_DISCOUNT_POLICY", entity_type="DISCOUNT_POLICY", entity_id=policy_id))
    db.commit()

# --- APPROVAL RULES ---
@router.get("/approval-rules")
def get_approval_rules(db: Session = Depends(get_db)):
    return db.query(ApprovalRule).all()

@router.post("/approval-rules", response_model=ApprovalRuleResponse, status_code=status.HTTP_201_CREATED)
def create_approval_rule(rule: ApprovalRuleCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_rule = ApprovalRule(**rule.model_dump())
    db.add(db_rule)
    db.add(AuditLog(actor_id=str(current_user.id), action="CREATE_APPROVAL_RULE", entity_type="APPROVAL_RULE", details=rule.model_dump()))
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.patch("/approval-rules/{rule_id}", response_model=ApprovalRuleResponse)
def update_approval_rule(rule_id: str, rule: ApprovalRuleUpdate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_rule = db.query(ApprovalRule).filter(ApprovalRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(404, "Rule not found")
    update_data = rule.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(db_rule, k, v)
    db.add(AuditLog(actor_id=str(current_user.id), action="UPDATE_APPROVAL_RULE", entity_type="APPROVAL_RULE", entity_id=rule_id, details=update_data))
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.delete("/approval-rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_approval_rule(rule_id: str, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_rule = db.query(ApprovalRule).filter(ApprovalRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(404, "Rule not found")
    db.delete(db_rule)
    db.add(AuditLog(actor_id=str(current_user.id), action="DELETE_APPROVAL_RULE", entity_type="APPROVAL_RULE", entity_id=rule_id))
    db.commit()

# --- APPROVAL CHAINS ---
@router.get("/approval-chains", response_model=List[ApprovalChainResponse])
def get_approval_chains(db: Session = Depends(get_db)):
    return db.query(ApprovalChain).all()

@router.post("/approval-chains", response_model=ApprovalChainResponse, status_code=status.HTTP_201_CREATED)
def create_approval_chain(chain: ApprovalChainCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_chain = ApprovalChain(**chain.model_dump())
    db.add(db_chain)
    db.add(AuditLog(actor_id=str(current_user.id), action="CREATE_APPROVAL_CHAIN", entity_type="APPROVAL_CHAIN", details=chain.model_dump()))
    db.commit()
    db.refresh(db_chain)
    return db_chain

@router.patch("/approval-chains/{chain_id}", response_model=ApprovalChainResponse)
def update_approval_chain(chain_id: str, chain: ApprovalChainUpdate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_chain = db.query(ApprovalChain).filter(ApprovalChain.id == chain_id).first()
    if not db_chain:
        raise HTTPException(404, "Chain not found")
    update_data = chain.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(db_chain, k, v)
    db.add(AuditLog(actor_id=str(current_user.id), action="UPDATE_APPROVAL_CHAIN", entity_type="APPROVAL_CHAIN", entity_id=chain_id, details=update_data))
    db.commit()
    db.refresh(db_chain)
    return db_chain

@router.delete("/approval-chains/{chain_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_approval_chain(chain_id: str, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_chain = db.query(ApprovalChain).filter(ApprovalChain.id == chain_id).first()
    if not db_chain:
        raise HTTPException(404, "Chain not found")
    db.delete(db_chain)
    db.add(AuditLog(actor_id=str(current_user.id), action="DELETE_APPROVAL_CHAIN", entity_type="APPROVAL_CHAIN", entity_id=chain_id))
    db.commit()

@router.get("/customers")
def list_customers(db: Session = Depends(get_db)):
    return db.query(Customer).all()

@router.get("/warehouses")
def list_warehouses(db: Session = Depends(get_db)):
    return db.query(Warehouse).all()

@router.get("/sales-reps")
def list_sales_reps(db: Session = Depends(get_db)):
    return db.query(User).filter(User.role.in_(["sales", "sales_rep", "manager", "sales_manager"])).all()
