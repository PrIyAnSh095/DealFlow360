from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from src.schemas.quotation import QuoteLineResponse

class QuoteMessageCreate(BaseModel):
    content: str
    sender_type: str = "CUSTOMER"

class QuoteMessageResponse(BaseModel):
    id: str
    quotation_id: str
    sender_type: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class PublicQuoteLineResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    quantity: int
    unit_price: float
    discount_percent: float
    total_price: float
    
    class Config:
        from_attributes = True

class PublicQuotationResponse(BaseModel):
    # Safe subset of quotation fields
    id: str
    deal_name: Optional[str] = None
    customer_name: Optional[str] = None
    status: str
    subtotal: float
    total_discount: float
    total: float
    lines: List[PublicQuoteLineResponse] = []
    
    class Config:
        from_attributes = True
