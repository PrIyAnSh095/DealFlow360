from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal

class QuoteLineInput(BaseModel):
    product_id: str
    quantity: int
    discount_percent: Decimal

class QuoteRecalculateRequest(BaseModel):
    lines: List[QuoteLineInput]

class QuoteLineResponse(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit_price: Decimal
    discount_percent: Decimal
    line_total: Decimal
    line_margin_percent: Decimal

class QuoteRecalculateResponse(BaseModel):
    subtotal: Decimal
    total_discount: Decimal
    total: Decimal
    estimated_cost: Decimal
    margin_percentage: Decimal
    risk_score: str # LOW, MEDIUM, HIGH
    requires_approval: bool
    explanations: List[str]
    lines: List[QuoteLineResponse]

class QuotationCreate(BaseModel):
    deal_id: str
    lines: List[QuoteLineInput]

class QuotationResponse(BaseModel):
    id: str
    deal_id: str
    status: str
    subtotal: Decimal
    total_discount: Decimal
    total: Decimal
    margin_percentage: Decimal
    risk_score: str
    requires_approval: bool
    
    class Config:
        from_attributes = True

class ProductResponse(BaseModel):
    id: str
    name: str
    sku: str
    category: str
    sales_price: Decimal
    
    class Config:
        from_attributes = True
