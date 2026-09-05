import uuid
from sqlalchemy import Column, String, Float, ForeignKey, Integer, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    deal_id = Column(String, ForeignKey("deals.id"), nullable=False)
    status = Column(String, default="draft")
    
    subtotal = Column(Float, default=0.0)
    total_discount = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    margin_percentage = Column(Float, default=0.0)
    
    risk_score = Column(String, default="low") # low, medium, high
    requires_approval = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    lines = relationship("QuoteLine", back_populates="quotation", cascade="all, delete-orphan")

class QuoteLine(Base):
    __tablename__ = "quote_lines"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    quotation_id = Column(String, ForeignKey("quotations.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False) # Copied from product at time of quote
    discount_percent = Column(Float, default=0.0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    quotation = relationship("Quotation", back_populates="lines")
    product = relationship("Product")
