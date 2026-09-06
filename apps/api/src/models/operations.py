import uuid
from sqlalchemy import Column, String, ForeignKey, Integer, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Warehouse(Base):
    __tablename__ = "warehouses"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    code = Column(String, nullable=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    pincode = Column(String, nullable=True, default="10001")
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True, default="India")
    capacity = Column(Integer, nullable=True, default=10000)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
class Stock(Base):
    __tablename__ = "stock"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(String, ForeignKey("warehouses.id"), nullable=False)
    quantity_on_hand = Column(Integer, default=0)
    quantity_allocated = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    product = relationship("Product")
    warehouse = relationship("Warehouse")

    @property
    def available_quantity(self) -> int:
        return max(0, self.quantity_on_hand - self.quantity_allocated)

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    quotation_id = Column(String, ForeignKey("quotations.id"), nullable=False, unique=True)
    status = Column(String, default="pending_fulfillment") # pending_fulfillment, processing, partially_shipped, shipped, delivered, fulfilled, cancelled
    
    tracking_number = Column(String, nullable=True)
    carrier = Column(String, nullable=True)
    estimated_delivery = Column(String, nullable=True)
    delivery_notes = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    quotation = relationship("Quotation")
    allocations = relationship("FulfillmentAllocation", back_populates="order")

class FulfillmentAllocation(Base):
    __tablename__ = "fulfillment_allocations"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    quote_line_id = Column(String, ForeignKey("quote_lines.id"), nullable=False)
    warehouse_id = Column(String, ForeignKey("warehouses.id"), nullable=True) # Null if backordered
    quantity = Column(Integer, nullable=False)
    
    order = relationship("Order", back_populates="allocations")
    quote_line = relationship("QuoteLine")
    warehouse = relationship("Warehouse")

class Backorder(Base):
    __tablename__ = "backorders"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    status = Column(String, default="PENDING")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order")
    product = relationship("Product")

