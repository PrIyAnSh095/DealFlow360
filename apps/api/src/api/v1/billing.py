from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
from datetime import datetime, timedelta
import calendar

from src.api.deps import get_db, get_current_user, RoleChecker
from src.models.user import User
from src.models.operations import Order
from src.models.deal import Deal
from src.models.customer import Customer
from src.models.quotation import Quotation, QuoteLine
from src.models.product import Product
from src.models.billing import Invoice, InvoiceLine, Payment, Subscription
from src.schemas.billing import (
    InvoiceResponse, PaymentCreate, PaymentResponse,
    SubscriptionResponse, SubscriptionActionRequest
)

router = APIRouter()

@router.get("/invoices", response_model=List[InvoiceResponse])
def get_invoices(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["finance", "admin"]))):
    invoices = db.query(Invoice).all()
    resp = []
    for inv in invoices:
        cust = db.query(Customer).filter(Customer.id == inv.customer_id).first()
        r = InvoiceResponse.model_validate(inv)
        if cust:
            r.customer_name = cust.name
        resp.append(r)
    return resp

@router.post("/orders/{order_id}/generate-invoice", response_model=InvoiceResponse)
def generate_invoice(order_id: str, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["finance", "admin"]))):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
        
    quote = db.query(Quotation).filter(Quotation.id == order.quotation_id).first()
    deal = db.query(Deal).filter(Deal.id == quote.deal_id).first()
    
    # Check if invoice already exists
    existing = db.query(Invoice).filter(Invoice.order_id == order_id).first()
    if existing:
        return existing
        
    # Create Invoice
    invoice = Invoice(
        order_id=order_id,
        customer_id=deal.customer_id,
        status="open",
        payment_status="unpaid",
        subtotal=quote.subtotal,
        total_discount=quote.total_discount,
        tax=Decimal('0.00'), # Mock tax
        total=quote.total,
        due_date=datetime.now() + timedelta(days=30)
    )
    db.add(invoice)
    db.flush()
    
    # Create Invoice Lines & Subscriptions
    quote_lines = db.query(QuoteLine).filter(QuoteLine.quotation_id == quote.id).all()
    for line in quote_lines:
        product = db.query(Product).filter(Product.id == line.product_id).first()
        
        # Determine if recurring
        # For DealFlow360 demo, let's assume if category is "subscription" or "saas"
        is_recurring = product and product.category.lower() in ["subscription", "saas", "software"]
        
        if is_recurring:
            # Create subscription
            sub = Subscription(
                order_id=order_id,
                customer_id=deal.customer_id,
                product_id=product.id,
                status="active",
                interval="month",
                quantity=line.quantity,
                price_per_period=line.unit_price * (Decimal('1.00') - (line.discount_percent/Decimal('100.0'))),
                current_period_end=datetime.now() + timedelta(days=30)
            )
            db.add(sub)
            
            # Also add to initial invoice
            inv_line = InvoiceLine(
                invoice_id=invoice.id,
                product_id=product.id,
                description=f"{product.name} (First Month)",
                quantity=line.quantity,
                unit_price=line.unit_price,
                amount=line.unit_price * line.quantity * (Decimal('1.00') - (line.discount_percent/Decimal('100.0')))
            )
            db.add(inv_line)
        else:
            # One-time item
            inv_line = InvoiceLine(
                invoice_id=invoice.id,
                product_id=product.id,
                description=product.name,
                quantity=line.quantity,
                unit_price=line.unit_price,
                amount=line.unit_price * line.quantity * (Decimal('1.00') - (line.discount_percent/Decimal('100.0')))
            )
            db.add(inv_line)
            
    db.commit()
    db.refresh(invoice)
    return invoice

@router.post("/invoices/{invoice_id}/pay", response_model=PaymentResponse)
def pay_invoice(invoice_id: str, payload: PaymentCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["finance", "admin"]))):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(404, "Invoice not found")
        
    payment = Payment(
        invoice_id=invoice_id,
        amount=payload.amount,
        method=payload.method,
        status="succeeded"
    )
    db.add(payment)
    
    invoice.amount_paid += payload.amount
    if invoice.amount_paid >= invoice.total:
        invoice.payment_status = "paid"
        invoice.status = "paid"
    elif invoice.amount_paid > Decimal('0.00'):
        invoice.payment_status = "partially_paid"
        
    db.commit()
    db.refresh(payment)
    return payment

@router.get("/subscriptions", response_model=List[SubscriptionResponse])
def get_subscriptions(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["finance", "admin"]))):
    subs = db.query(Subscription).all()
    resp = []
    for sub in subs:
        cust = db.query(Customer).filter(Customer.id == sub.customer_id).first()
        prod = db.query(Product).filter(Product.id == sub.product_id).first()
        r = SubscriptionResponse.model_validate(sub)
        if cust: r.customer_name = cust.name
        if prod: r.product_name = prod.name
        resp.append(r)
    return resp

@router.post("/subscriptions/{sub_id}/modify", response_model=SubscriptionResponse)
def modify_subscription(sub_id: str, payload: SubscriptionActionRequest, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["finance", "admin"]))):
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(404, "Subscription not found")
        
    if payload.new_quantity is not None:
        # Proration calculation
        # Simplified: if quantity changes mid cycle, we create an invoice for the difference.
        old_qty = sub.quantity
        new_qty = payload.new_quantity
        sub.quantity = new_qty
        
        # calculate remaining days
        now = datetime.now(sub.current_period_end.tzinfo) if sub.current_period_end.tzinfo else datetime.now()
        if sub.current_period_end and sub.current_period_end > now:
            days_remaining = (sub.current_period_end - now).days
            total_days_in_month = 30 # Simplified
            
            qty_delta = new_qty - old_qty
            prorated_amount = (sub.price_per_period / total_days_in_month) * days_remaining * qty_delta
            
            if prorated_amount != Decimal('0.00'):
                # Generate proration invoice
                inv = Invoice(
                    order_id=sub.order_id,
                    customer_id=sub.customer_id,
                    status="open",
                    payment_status="unpaid",
                    subtotal=prorated_amount,
                    total=prorated_amount,
                    due_date=now + timedelta(days=7)
                )
                db.add(inv)
                db.flush()
                
                inv_line = InvoiceLine(
                    invoice_id=inv.id,
                    product_id=sub.product_id,
                    description=f"Proration for quantity change ({old_qty} -> {new_qty})",
                    quantity=abs(qty_delta),
                    unit_price=sub.price_per_period,
                    amount=prorated_amount
                )
                db.add(inv_line)
                
    db.commit()
    db.refresh(sub)
    return sub

@router.post("/subscriptions/{sub_id}/cancel")
def cancel_subscription(sub_id: str, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["finance", "admin"]))):
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(404, "Subscription not found")
        
    sub.status = "canceled"
    sub.canceled_at = datetime.now()
    db.commit()
    return {"message": "Subscription canceled"}
