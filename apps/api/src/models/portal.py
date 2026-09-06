import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class QuoteMessage(Base):
    __tablename__ = "quote_messages"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    quotation_id = Column(String, ForeignKey("quotations.id"), nullable=False)
    sender_id = Column(String, ForeignKey("users.id"), nullable=True)
    
    sender_type = Column(String, nullable=False) # 'INTERNAL', 'SALES_REP', 'CUSTOMER', or 'SYSTEM'
    content = Column(String, nullable=False)
    status = Column(String, default="PENDING_REP_RESPONSE") # PENDING_REP_RESPONSE, ACCEPTED, REJECTED, COUNTERED
    counter_discount_pct = Column(Float, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    quotation = relationship("Quotation")
    sender = relationship("User", foreign_keys=[sender_id])
