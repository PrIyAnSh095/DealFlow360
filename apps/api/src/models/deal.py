import uuid
from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.sql import func
from src.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Deal(Base):
    __tablename__ = "deals"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    customer_name = Column(String, nullable=False)
    value = Column(Float, default=0.0)
    status = Column(String, default="draft", nullable=False) # Kanban column
    risk = Column(String, default="low") # low, medium, high
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
