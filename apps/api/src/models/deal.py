import uuid
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Deal(Base):
    __tablename__ = "deals"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String, nullable=True)
    value = Column(Numeric(10, 2), default=0.00)
    status = Column(String, default="draft", nullable=False) # Kanban column
    risk = Column(String, default="low") # low, medium, high
    
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)
    
    customer = relationship("Customer", back_populates="deals")
    quotations = relationship("Quotation", back_populates="deal", cascade="all, delete-orphan")
    owner = relationship("User", foreign_keys=[owner_id])
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
