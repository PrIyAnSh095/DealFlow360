from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

class PaymentCreate(BaseModel):
    amount: Decimal
    method: str = "credit_card"

class PaymentResponse(BaseModel):
    id: str
    amount: Decimal
    method: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class InvoiceLineResponse(BaseModel):
    id: str
    product_id: str
    description: Optional[str]
    quantity: int
    unit_price: Decimal
    amount: Decimal
    
    class Config:
        from_attributes = True

class InvoiceResponse(BaseModel):
    id: str
    order_id: str
    customer_id: str
    customer_name: Optional[str] = None
    status: str
    payment_status: str
    subtotal: Decimal
    total_discount: Decimal
    tax: Decimal
    total: Decimal
    amount_paid: Decimal
    created_at: datetime
    due_date: Optional[datetime] = None
    lines: List[InvoiceLineResponse] = []
    payments: List[PaymentResponse] = []
    
    class Config:
        from_attributes = True

class SubscriptionResponse(BaseModel):
    id: str
    order_id: str
    customer_id: str
    customer_name: Optional[str] = None
    product_id: str
    product_name: Optional[str] = None
    status: str
    interval: str
    quantity: int
    price_per_period: Decimal
    current_period_start: datetime
    current_period_end: Optional[datetime] = None
    canceled_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class SubscriptionActionRequest(BaseModel):
    new_quantity: Optional[int] = None
    new_plan_id: Optional[str] = None
