from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.sql import func
from src.core.database import Base

class CompanyAIConfig(Base):
    __tablename__ = "company_ai_configs"

    id = Column(String, primary_key=True, default="default-config")
    provider = Column(String, default="ollama", nullable=False)
    model_name = Column(String, default="llama3", nullable=False)
    enabled = Column(Boolean, default=True, nullable=False)

    # Customer Profile Data Toggles
    share_customer_tier = Column(Boolean, default=True, nullable=False)
    share_loyalty_status = Column(Boolean, default=True, nullable=False)
    share_account_age = Column(Boolean, default=True, nullable=False)

    # Commercial History Data Toggles
    share_lifetime_revenue = Column(Boolean, default=True, nullable=False)
    share_purchase_count = Column(Boolean, default=True, nullable=False)
    share_purchase_frequency = Column(Boolean, default=True, nullable=False)
    share_avg_order_value = Column(Boolean, default=True, nullable=False)
    share_historical_discounts = Column(Boolean, default=True, nullable=False)

    # Subscription Data Toggles
    share_active_subscriptions = Column(Boolean, default=True, nullable=False)
    share_subscription_type = Column(Boolean, default=True, nullable=False)
    share_subscription_value = Column(Boolean, default=True, nullable=False)
    share_renewal_info = Column(Boolean, default=True, nullable=False)

    # Quotation & Pricing Data Toggles
    share_product_info = Column(Boolean, default=True, nullable=False)
    share_pricing = Column(Boolean, default=True, nullable=False)
    share_discounts = Column(Boolean, default=True, nullable=False)
    share_margins = Column(Boolean, default=True, nullable=False)
    share_approval_status = Column(Boolean, default=True, nullable=False)

    # Deal Context Toggles
    share_deal_health = Column(Boolean, default=True, nullable=False)
    share_deal_stage = Column(Boolean, default=True, nullable=False)
    share_negotiation_history = Column(Boolean, default=True, nullable=False)
    share_delivery_risk = Column(Boolean, default=True, nullable=False)

    # Fulfillment Data Toggles
    share_warehouse_availability = Column(Boolean, default=True, nullable=False)
    share_stock_quantities = Column(Boolean, default=True, nullable=False)
    share_allocation_plans = Column(Boolean, default=True, nullable=False)
    share_backorders = Column(Boolean, default=True, nullable=False)

    # Shipping & Logistics Toggles
    share_shipping_cost = Column(Boolean, default=True, nullable=False)
    share_courier_info = Column(Boolean, default=True, nullable=False)
    share_eta = Column(Boolean, default=True, nullable=False)
    share_logistics_info = Column(Boolean, default=True, nullable=False)

    # AI Purpose Toggles
    purpose_quotation_explanation = Column(Boolean, default=True, nullable=False)
    purpose_sales_recommendation = Column(Boolean, default=True, nullable=False)
    purpose_finance_analysis = Column(Boolean, default=True, nullable=False)
    purpose_fulfillment_recommendation = Column(Boolean, default=True, nullable=False)
    purpose_deal_health_explanation = Column(Boolean, default=True, nullable=False)

    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
