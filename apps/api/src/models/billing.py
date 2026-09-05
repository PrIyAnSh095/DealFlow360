import uuid
from sqlalchemy import Column, String, ForeignKey, Integer, DateTime, Numeric, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    
    status = Column(String, default="draft") # draft, open, paid, void, uncollectible
    payment_status = Column(String, default="unpaid") # unpaid, partially_paid, paid
    
    subtotal = Column(Numeric(10, 2), default=0.00)
    total_discount = Column(Numeric(10, 2), default=0.00)
    tax = Column(Numeric(10, 2), default=0.00)
    total = Column(Numeric(10, 2), default=0.00)
    amount_paid = Column(Numeric(10, 2), default=0.00)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    due_date = Column(DateTime(timezone=True), nullable=True)
    
    lines = relationship("InvoiceLine", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice")
    order = relationship("Order")

class InvoiceLine(Base):
    __tablename__ = "invoice_lines"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    
    description = Column(String, nullable=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(Numeric(10, 2), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    
    invoice = relationship("Invoice", back_populates="lines")
    product = relationship("Product")

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    
    status = Column(String, default="active") # active, past_due, canceled
    interval = Column(String, default="month") # month, year
    
    quantity = Column(Integer, default=1)
    price_per_period = Column(Numeric(10, 2), nullable=False)
    
    current_period_start = Column(DateTime(timezone=True), server_default=func.now())
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    canceled_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=False)
    
    amount = Column(Numeric(10, 2), nullable=False)
    method = Column(String, default="credit_card")
    status = Column(String, default="succeeded")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    invoice = relationship("Invoice", back_populates="payments")
