import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class CustomerTier(Base):
    __tablename__ = "customer_tiers"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, nullable=False, unique=True) # e.g. Bronze, Silver, Gold, Enterprise
    min_spend = Column(Float, default=0.0)
    max_discount_pct = Column(Float, default=15.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    company = Column(String, nullable=True)
    tier_id = Column(String, ForeignKey("customer_tiers.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tier = relationship("CustomerTier")
    deals = relationship("Deal", back_populates="customer")

