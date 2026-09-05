import uuid
from sqlalchemy import Column, String, Numeric, Boolean, Integer, DateTime
from sqlalchemy.sql import func
from src.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class PricingRule(Base):
    __tablename__ = "pricing_rules"
    __table_args__ = {'extend_existing': True}
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, nullable=False)
    target_role = Column(String, nullable=False)
    max_discount_percent = Column(Numeric(5, 2), nullable=False)
    requires_approval_above = Column(Numeric(5, 2), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    __table_args__ = {'extend_existing': True}
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    interval = Column(String, default="month") # month, year
    price = Column(Numeric(10, 2), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class GlobalSetting(Base):
    __tablename__ = "global_settings"
    __table_args__ = {'extend_existing': True}
    
    key = Column(String, primary_key=True, index=True)
    value = Column(String, nullable=False)
    description = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class Category(Base):
    __tablename__ = "categories"
    __table_args__ = {'extend_existing': True}
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class CustomerTier(Base):
    __tablename__ = "customer_tiers"
    __table_args__ = {'extend_existing': True}
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, nullable=False, unique=True) # e.g. Bronze, Silver, Gold
    baseline_discount = Column(Numeric(5, 2), default=0.00)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class DiscountPolicy(Base):
    __tablename__ = "discount_policies"
    __table_args__ = {'extend_existing': True}
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, nullable=False)
    target_tier = Column(String, nullable=True) # If null, applies to all
    target_category = Column(String, nullable=True) # If null, applies to all
    max_discount_percent = Column(Numeric(5, 2), nullable=False)
    min_margin_percent = Column(Numeric(5, 2), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ApprovalRule(Base):
    __tablename__ = "approval_rules"
    __table_args__ = {'extend_existing': True}
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, nullable=False)
    risk_threshold = Column(String, nullable=True) # low, medium, high
    discount_threshold = Column(Numeric(5, 2), nullable=True) # Trigger if discount > X
    target_role = Column(String, nullable=False) # e.g. sales_manager, finance
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ApprovalChain(Base):
    __tablename__ = "approval_chains"
    __table_args__ = {'extend_existing': True}
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, nullable=False)
    sequence = Column(String, nullable=False) # e.g. "sales_manager,finance,admin"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
