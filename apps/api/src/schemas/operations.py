from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class WarehouseBase(BaseModel):
    name: str
    location: str

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None

class WarehouseResponse(WarehouseBase):
    id: str
    
    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: str
    quotation_id: str
    status: str
    created_at: datetime
    customer_name: Optional[str] = None
    deal_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class FulfillmentAllocationInput(BaseModel):
    quote_line_id: str
    warehouse_id: Optional[str] # Null for backorder
    quantity: int

class FulfillmentRequest(BaseModel):
    allocations: List[FulfillmentAllocationInput]

class FulfillmentRecommendationLine(BaseModel):
    quote_line_id: str
    product_name: str
    requested_quantity: int
    recommended_allocations: List[FulfillmentAllocationInput]
    
class FulfillmentRecommendationResponse(BaseModel):
    order_id: str
    lines: List[FulfillmentRecommendationLine]
