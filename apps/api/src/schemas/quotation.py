from pydantic import BaseModel
from typing import List, Optional

class QuoteLineInput(BaseModel):
    product_id: str
    quantity: int
    discount_percent: float

class QuoteRecalculateRequest(BaseModel):
    lines: List[QuoteLineInput]

class QuoteLineResponse(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit_price: float
    discount_percent: float
    line_total: float
    line_margin_percent: float

class QuoteRecalculateResponse(BaseModel):
    subtotal: float
    total_discount: float
    total: float
    estimated_cost: float
    margin_percentage: float
    risk_score: str # LOW, MEDIUM, HIGH
    requires_approval: bool
    explanations: List[str]
    lines: List[QuoteLineResponse]

class QuotationResponse(BaseModel):
    id: str
    deal_id: str
    status: str
    subtotal: float
    total_discount: float
    total: float
    margin_percentage: float
    risk_score: str
    requires_approval: bool
    
    class Config:
        from_attributes = True

class ProductResponse(BaseModel):
    id: str
    name: str
    sku: str
    category: str
    sales_price: float
    
    class Config:
        from_attributes = True
