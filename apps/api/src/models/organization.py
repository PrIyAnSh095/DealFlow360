from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.sql import func
from src.core.database import Base

class OrganizationProfile(Base):
    __tablename__ = "organization_profiles"

    id = Column(String, primary_key=True, default="org-default")
    company_name = Column(String, default="DealFlow360 Enterprises", nullable=False)
    legal_name = Column(String, default="DealFlow360 Technologies Private Limited", nullable=True)
    industry = Column(String, default="Software & Enterprise IT Services", nullable=False)
    business_type = Column(String, default="B2B Enterprise SaaS & Hardware", nullable=False)
    headquarters = Column(String, default="San Francisco, CA", nullable=False)
    operating_regions = Column(String, default="North America, Europe, Asia Pacific", nullable=False)
    countries_served = Column(String, default="United States, Canada, United Kingdom, India", nullable=False)
    primary_currency = Column(String, default="INR", nullable=False)
    timezone = Column(String, default="Asia/Kolkata", nullable=False)
    business_description = Column(String, default="Leading provider of enterprise B2B deal execution, quotation intelligence, and automated fulfillment solutions.", nullable=False)

    # Business Model & Customer Strategy
    primary_sales_model = Column(String, default="Hybrid (One-time Hardware & Recurring SaaS)", nullable=False)
    typical_deal_size = Column(String, default="₹100,000 - ₹5,000,000", nullable=False)
    customer_loyalty_definition = Column(String, default="Account age >= 2 years and total lifetime spend exceeding ₹1,500,000.", nullable=False)
    
    # Commercial & Operational Context
    pricing_strategy = Column(String, default="Value-based tiered pricing with strict target margin enforcement.", nullable=False)
    discount_philosophy = Column(String, default="Sales reps permitted up to 10%. 10-25% requires Sales Manager approval. >25% requires Finance VP override.", nullable=False)
    margin_priority = Column(String, default="Maintain minimum 15.0% gross margin on hardware and 70.0% on software subscriptions.", nullable=False)
    fulfillment_priority = Column(String, default="Optimize for lowest shipping cost while meeting delivery commitments within 5 business days.", nullable=False)

    onboarding_completed = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
