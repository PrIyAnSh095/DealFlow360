from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from decimal import Decimal

class CustomerTierResponse(BaseModel):
    id: str
    name: str
    min_spend: Optional[float] = 0.0
    max_discount_pct: Optional[float] = 15.0

    class Config:
        from_attributes = True

class CustomerBase(BaseModel):
    name: str
    email: EmailStr
    company: Optional[str] = None
    tier_id: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: str
    tier: Optional[CustomerTierResponse] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    lifetime_revenue: Optional[Decimal] = None
    total_orders: Optional[int] = None

    class Config:
        from_attributes = True
