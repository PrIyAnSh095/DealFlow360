import uuid
from sqlalchemy import Column, String, ForeignKey, Integer, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Warehouse(Base):
    __tablename__ = "warehouses"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    
class Stock(Base):
    __tablename__ = "stock"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(String, ForeignKey("warehouses.id"), nullable=False)
    quantity_on_hand = Column(Integer, default=0)
    quantity_allocated = Column(Integer, default=0)
    
    product = relationship("Product")
    warehouse = relationship("Warehouse")

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    quotation_id = Column(String, ForeignKey("quotations.id"), nullable=False, unique=True)
    status = Column(String, default="pending_fulfillment") # pending_fulfillment, fulfilled, invoiced
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
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
