from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import List

from src.api.deps import INTERNAL_ROLES, get_db, RoleChecker
from src.models.user import User
from src.models.admin import (
    SubscriptionPlan, GlobalSetting, 
    Category, CustomerTier, DiscountPolicy
)
from src.models.product import Product
from src.schemas.admin import (
    SubscriptionPlanCreate, SubscriptionPlanUpdate, SubscriptionPlanResponse,
    GlobalSettingCreate, GlobalSettingUpdate, GlobalSettingResponse,
    AdminUserCreate, AdminUserUpdate, AuditLogResponse,
    CategoryCreate, CategoryUpdate, CategoryResponse,
    CustomerTierCreate, CustomerTierUpdate, CustomerTierResponse,
    DiscountPolicyCreate, DiscountPolicyUpdate, DiscountPolicyResponse
)
from src.schemas.user import UserResponse
from src.models.audit import AuditLog
from src.core.security import get_password_hash
from src.schemas.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter()


# --- SUBSCRIPTION PLANS ---
@router.get("/subscription-plans", response_model=List[SubscriptionPlanResponse])
def get_subscription_plans(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    return db.query(SubscriptionPlan).all()

@router.post("/subscription-plans", response_model=SubscriptionPlanResponse, status_code=status.HTTP_201_CREATED)
def create_subscription_plan(plan: SubscriptionPlanCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_plan = SubscriptionPlan(**plan.model_dump())
    db.add(db_plan)
    db.add(AuditLog(actor_id=str(current_user.id), action="CREATE_SUBSCRIPTION_PLAN", entity_type="SUBSCRIPTION_PLAN", details=plan.model_dump()))
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.patch("/subscription-plans/{plan_id}", response_model=SubscriptionPlanResponse)
def update_subscription_plan(plan_id: str, plan: SubscriptionPlanUpdate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
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
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
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
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_setting = GlobalSetting(**setting.model_dump())
    db.add(db_setting)
    db.add(AuditLog(actor_id=str(current_user.id), action="CREATE_GLOBAL_SETTING", entity_type="GLOBAL_SETTING", details=setting.model_dump()))
    db.commit()
    db.refresh(db_setting)
    return db_setting

@router.patch("/settings/{key}", response_model=GlobalSettingResponse)
def update_setting(key: str, setting: GlobalSettingUpdate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
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
def get_all_products(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(INTERNAL_ROLES))):
    return db.query(Product).all()

@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    product_dict = product.model_dump()
    if 'is_active' in product_dict:
        product_dict['active'] = product_dict.pop('is_active')
        
    # Auto-create category if it doesn't exist
    if product_dict.get('category'):
        cat_name = product_dict['category']
        existing_cat = db.query(Category).filter(Category.name == cat_name).first()
        if not existing_cat:
            new_cat = Category(name=cat_name, description=f"Auto-created from product {product_dict['name']}")
            db.add(new_cat)
            
    db_prod = Product(**product_dict)
    db.add(db_prod)
    db.add(AuditLog(actor_id=str(current_user.id), action="CREATE_PRODUCT", entity_type="PRODUCT", details=jsonable_encoder(product)))
    db.commit()
    db.refresh(db_prod)
    return db_prod

@router.patch("/products/{product_id}", response_model=ProductResponse)
def update_product(product_id: str, product: ProductUpdate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_prod = db.query(Product).filter(Product.id == product_id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail="Product not found")
        
    update_data = product.model_dump(exclude_unset=True)
    if 'is_active' in update_data:
        update_data['active'] = update_data.pop('is_active')
        
    # Auto-create category if it doesn't exist
    if update_data.get('category'):
        cat_name = update_data['category']
        existing_cat = db.query(Category).filter(Category.name == cat_name).first()
        if not existing_cat:
            new_cat = Category(name=cat_name, description=f"Auto-created from product update {db_prod.name}")
            db.add(new_cat)
            
    for field, value in update_data.items():
        setattr(db_prod, field, value)
        
    db.add(AuditLog(actor_id=str(current_user.id), action="UPDATE_PRODUCT", entity_type="PRODUCT", entity_id=product_id, details=jsonable_encoder(update_data)))
    db.commit()
    db.refresh(db_prod)
    return db_prod

# --- USERS (Admin CRUD) ---
@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
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
        is_active=user_in.is_active
    )
    db.add(db_user)
    
    # Audit log
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
@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()

# --- CATEGORIES ---
@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(INTERNAL_ROLES))):
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
@router.get("/customer-tiers", response_model=List[CustomerTierResponse])
def get_customer_tiers(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(INTERNAL_ROLES))):
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
@router.get("/discount-policies", response_model=List[DiscountPolicyResponse])
def get_discount_policies(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(INTERNAL_ROLES))):
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


