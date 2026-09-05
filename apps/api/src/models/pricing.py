import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)

class PriceList(Base):
    __tablename__ = "price_lists"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, nullable=False)
    currency = Column(String, default="USD")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PriceListItem(Base):
    __tablename__ = "price_list_items"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    price_list_id = Column(String, ForeignKey("price_lists.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    price = Column(Float, nullable=False)

    price_list = relationship("PriceList")
    product = relationship("Product")

class DiscountPolicy(Base):
    __tablename__ = "discount_policies"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    tier_id = Column(String, ForeignKey("customer_tiers.id"), nullable=True)
    category_id = Column(String, ForeignKey("categories.id"), nullable=True)
    max_discount_pct = Column(Float, nullable=False, default=20.0)

    tier = relationship("CustomerTier")
    category = relationship("Category")

class ApprovalRule(Base):
    __tablename__ = "approval_rules"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    required_role = Column(String, nullable=False) # manager, finance, admin
    min_discount_pct = Column(Float, default=0.0)
    max_discount_pct = Column(Float, default=100.0)
    min_risk_level = Column(String, default="LOW") # LOW, MEDIUM, HIGH
