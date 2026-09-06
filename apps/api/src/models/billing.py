import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Integer, Boolean, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

from src.models.admin import SubscriptionPlan

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=True)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    plan_id = Column(String, ForeignKey("subscription_plans.id"), nullable=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=True)
    
    status = Column(String, default="ACTIVE") # ACTIVE, CANCELLED, PAUSED, active, past_due, canceled
    interval = Column(String, default="monthly") # monthly, yearly, month, year
    
    quantity = Column(Integer, default=1)
    price_per_period = Column(Float, nullable=True)
    
    start_date = Column(DateTime(timezone=True), server_default=func.now())
    end_date = Column(DateTime(timezone=True), nullable=True)
    current_period_start = Column(DateTime(timezone=True), server_default=func.now())
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    canceled_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    customer = relationship("Customer")
    plan = relationship("SubscriptionPlan")
    lines = relationship("SubscriptionLine", back_populates="subscription", cascade="all, delete-orphan")

class SubscriptionLine(Base):
    __tablename__ = "subscription_lines"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    subscription_id = Column(String, ForeignKey("subscriptions.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    billing_cycle = Column(String, default="monthly")

    subscription = relationship("Subscription", back_populates="lines")
    product = relationship("Product")

class BillingScheduleItem(Base):
    __tablename__ = "billing_schedule_items"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    subscription_id = Column(String, ForeignKey("subscriptions.id"), nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, default="PENDING") # PENDING, INVOICED, PAID

    subscription = relationship("Subscription")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=True)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=True)
    
    status = Column(String, default="UNPAID") # UNPAID, PAID, PARTIAL, CANCELLED, draft, open, void
    payment_status = Column(String, default="unpaid") # unpaid, partially_paid, paid
    
    subtotal = Column(Float, default=0.0)
    total_discount = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    amount_paid = Column(Float, default=0.0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    due_date = Column(DateTime(timezone=True), nullable=True)

    lines = relationship("InvoiceLine", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice")
    order = relationship("Order")

class InvoiceLine(Base):
    __tablename__ = "invoice_lines"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=True)
    description = Column(String, nullable=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)

    invoice = relationship("Invoice", back_populates="lines")
    product = relationship("Product")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=False)
    amount = Column(Float, nullable=False)
    method = Column(String, default="CREDIT_CARD") # CREDIT_CARD, BANK_TRANSFER, CHEQUE
    status = Column(String, default="COMPLETED")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    invoice = relationship("Invoice", back_populates="payments")
