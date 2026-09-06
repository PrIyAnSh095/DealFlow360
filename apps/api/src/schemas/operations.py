from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class WarehouseBase(BaseModel):
    name: str
    location: str
    code: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    capacity: Optional[int] = 10000
    pincode: Optional[str] = "10001"
    is_active: Optional[bool] = True

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    code: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    capacity: Optional[int] = None
    pincode: Optional[str] = None
    is_active: Optional[bool] = None

class WarehouseResponse(WarehouseBase):
    id: str
    pincode: Optional[str] = "10001"
    is_active: bool = True
    
    class Config:
        from_attributes = True

class StockItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    sku: Optional[str] = None
    warehouse_id: str
    warehouse_name: str
    quantity_on_hand: int
    quantity_allocated: int
    available_quantity: int

class StockUpdateInput(BaseModel):
    quantity_on_hand: int
    reason: Optional[str] = "Manual stock adjustment"

class OrderStatusUpdate(BaseModel):
    status: Optional[str] = None
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None
    estimated_delivery: Optional[str] = None
    delivery_notes: Optional[str] = None

class OrderResponse(BaseModel):
    id: str
    quotation_id: str
    status: str
    created_at: datetime
    customer_name: Optional[str] = None
    deal_name: Optional[str] = None
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None
    estimated_delivery: Optional[str] = None
    delivery_notes: Optional[str] = None
    
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

class WarehouseStockResponse(BaseModel):
    name: str
    location: str
    available: int

class BackorderResponse(BaseModel):
    id: str
    orderId: str
    customer: str
    product: str
    sku: str
    ordered: int
    shipped: int
    pending: int
    status: str
    orderDate: str
    eta: Optional[str] = None
    valueAtRisk: float
    warehouses: List[WarehouseStockResponse]

    class Config:
        from_attributes = True
