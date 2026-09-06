from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from src.schemas.customer import CustomerResponse

class QuoteLineCreateInput(BaseModel):
    product_id: str
    quantity: int = 1
    discount_percent: Decimal = Decimal('0.00')

class InitialQuotationCreateInput(BaseModel):
    lines: Optional[List[QuoteLineCreateInput]] = None

class DealBase(BaseModel):
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    owner_id: Optional[str] = None
    value: Decimal = Decimal('0.00')
    status: str = "draft"
    risk: str = "low"

class DealCreate(DealBase):
    initial_quotation: Optional[InitialQuotationCreateInput] = None

class DealUpdate(BaseModel):
    status: Optional[str] = None
    value: Optional[Decimal] = None
    risk: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None

class DealResponse(DealBase):
    id: str
    customer: Optional[CustomerResponse] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
