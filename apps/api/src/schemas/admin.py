from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime
from pydantic import EmailStr



# Subscription Plans
class SubscriptionPlanBase(BaseModel):
    name: str
    description: Optional[str] = None
    interval: str = "month"
    price: float
    is_active: bool = True

class SubscriptionPlanCreate(SubscriptionPlanBase):
    pass

class SubscriptionPlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    interval: Optional[str] = None
    price: Optional[float] = None
    is_active: Optional[bool] = None

class SubscriptionPlanResponse(SubscriptionPlanBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Global Settings
class GlobalSettingBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

class GlobalSettingCreate(GlobalSettingBase):
    pass

class GlobalSettingUpdate(BaseModel):
    value: Optional[str] = None
    description: Optional[str] = None

class GlobalSettingResponse(GlobalSettingBase):
    updated_at: datetime

    class Config:
        from_attributes = True

# Users (Admin)
class AdminUserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
    is_active: bool = True
    company: Optional[str] = None
    tier: Optional[str] = None

class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    company: Optional[str] = None
    tier: Optional[str] = None

# Audit Logs
class AuditLogResponse(BaseModel):
    id: str
    actor_id: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Categories
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class CategoryResponse(CategoryBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Customer Tiers
class CustomerTierBase(BaseModel):
    name: str
    baseline_discount: float = 0.00
    is_active: bool = True

class CustomerTierCreate(CustomerTierBase):
    pass

class CustomerTierUpdate(BaseModel):
    name: Optional[str] = None
    baseline_discount: Optional[float] = None
    is_active: Optional[bool] = None

class CustomerTierResponse(CustomerTierBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Discount Policies
class DiscountPolicyBase(BaseModel):
    name: str
    target_tier: Optional[str] = None
    product_category: Optional[str] = None
    employee_role: Optional[str] = None
    max_discount_percent: float
    min_margin_percent: Optional[float] = None
    is_active: bool = True

class DiscountPolicyCreate(DiscountPolicyBase):
    pass

class DiscountPolicyUpdate(BaseModel):
    name: Optional[str] = None
    target_tier: Optional[str] = None
    product_category: Optional[str] = None
    employee_role: Optional[str] = None
    max_discount_percent: Optional[float] = None
    min_margin_percent: Optional[float] = None
    is_active: Optional[bool] = None

class DiscountPolicyResponse(DiscountPolicyBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Pricing Rules
class PricingRuleBase(BaseModel):
    name: str
    target_role: str
    max_discount_percent: float
    requires_approval_above: float
    is_active: bool = True

class PricingRuleCreate(PricingRuleBase):
    pass

class PricingRuleUpdate(BaseModel):
    name: Optional[str] = None
    target_role: Optional[str] = None
    max_discount_percent: Optional[float] = None
    requires_approval_above: Optional[float] = None
    is_active: Optional[bool] = None

class PricingRuleResponse(PricingRuleBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Approval Rules
class ApprovalRuleBase(BaseModel):
    name: str
    risk_threshold: Optional[str] = None
    discount_threshold: Optional[float] = None
    target_role: str
    is_active: bool = True

class ApprovalRuleCreate(ApprovalRuleBase):
    pass

class ApprovalRuleUpdate(BaseModel):
    name: Optional[str] = None
    risk_threshold: Optional[str] = None
    discount_threshold: Optional[float] = None
    target_role: Optional[str] = None
    is_active: Optional[bool] = None

class ApprovalRuleResponse(ApprovalRuleBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Approval Chains
class ApprovalChainBase(BaseModel):
    name: str
    sequence: str
    is_active: bool = True

class ApprovalChainCreate(ApprovalChainBase):
    pass

class ApprovalChainUpdate(BaseModel):
    name: Optional[str] = None
    sequence: Optional[str] = None
    is_active: Optional[bool] = None

class ApprovalChainResponse(ApprovalChainBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
