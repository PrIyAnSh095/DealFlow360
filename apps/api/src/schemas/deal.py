from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from decimal import Decimal
from src.schemas.customer import CustomerResponse

class DealBase(BaseModel):
    customer_id: str
    value: Decimal = Decimal('0.00')
    status: str = "draft"
    risk: str = "low"

class DealCreate(DealBase):
    pass

class DealUpdate(BaseModel):
    status: Optional[str] = None
    value: Optional[Decimal] = None
    risk: Optional[str] = None

class DealResponse(DealBase):
    id: str
    customer: Optional[CustomerResponse] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
