from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

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
