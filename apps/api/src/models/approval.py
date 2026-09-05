import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    quotation_id = Column(String, ForeignKey("quotations.id"), nullable=False)
    requester_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    status = Column(String, default="PENDING") # PENDING, APPROVED, REJECTED, RETURNED
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    quotation = relationship("Quotation")
    logs = relationship("ApprovalAuditLog", back_populates="approval_request", cascade="all, delete-orphan")

class ApprovalAuditLog(Base):
    __tablename__ = "approval_audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    approval_request_id = Column(String, ForeignKey("approval_requests.id"), nullable=False)
    actor_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    action = Column(String, nullable=False) # SUBMITTED, APPROVED, REJECTED, RETURNED
    reason = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    approval_request = relationship("ApprovalRequest", back_populates="logs")
