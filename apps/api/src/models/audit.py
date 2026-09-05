import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from src.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, nullable=True)
    action = Column(String, nullable=False) # e.g. QUOTE_CREATED, APPROVAL_DECISION, STOCK_ALLOCATED
    entity_type = Column(String, nullable=False) # e.g. Quotation, Approval, Order
    entity_id = Column(String, nullable=False)
    details = Column(String, nullable=True) # JSON or text summary
    created_at = Column(DateTime(timezone=True), server_default=func.now())
