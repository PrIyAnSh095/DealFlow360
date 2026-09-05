import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class QuoteMessage(Base):
    __tablename__ = "quote_messages"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    quotation_id = Column(String, ForeignKey("quotations.id"), nullable=False)
    
    sender_type = Column(String, nullable=False) # 'INTERNAL' or 'CUSTOMER'
    content = Column(String, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    quotation = relationship("Quotation")
