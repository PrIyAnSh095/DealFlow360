from datetime import datetime, timedelta
from typing import List, Dict
from sqlalchemy.orm import Session
from src.models.billing import Subscription, SubscriptionLine, BillingScheduleItem, Invoice, InvoiceLine, Payment
from src.models.operations import Order
from src.models.quotation import Quotation, QuoteLine
from src.models.product import Product

def create_subscription_from_quotation(db: Session, quotation: Quotation, customer_id: str) -> Subscription:
    sub = Subscription(
        customer_id=customer_id,
        status="ACTIVE",
        start_date=datetime.utcnow()
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    for line in quotation.lines:
        p = db.query(Product).filter(Product.id == line.product_id).first()
        if p and p.category and "software" in p.category.lower() or p and "subscription" in p.name.lower():
            sub_line = SubscriptionLine(
                subscription_id=sub.id,
                product_id=line.product_id,
                quantity=line.quantity,
                unit_price=line.unit_price * (1 - line.discount_percent / 100.0),
                billing_cycle="monthly"
            )
            db.add(sub_line)

    db.commit()
    
    # Generate 12-month billing schedule
    generate_billing_schedules(db, sub.id)
    return sub

def generate_billing_schedules(db: Session, subscription_id: str):
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        return

    total_monthly = sum(line.quantity * line.unit_price for line in sub.lines)
    if total_monthly <= 0:
        total_monthly = 500.0 # Default base plan rate

    start = sub.start_date or datetime.utcnow()
    for i in range(12):
        due = start + timedelta(days=30 * i)
        item = BillingScheduleItem(
            subscription_id=subscription_id,
            due_date=due,
            amount=round(total_monthly, 2),
            status="PAID" if i == 0 else "PENDING"
        )
        db.add(item)
    db.commit()

def generate_invoice_from_order(db: Session, order: Order) -> Invoice:
    quotation = db.query(Quotation).filter(Quotation.id == order.quotation_id).first()
    subtotal = float(quotation.total) if (quotation and quotation.total is not None) else 0.0
    tax = round(subtotal * 0.18, 2) # 18% standard tax
    total = subtotal + tax

    inv = Invoice(
        order_id=order.id,
        status="UNPAID",
        subtotal=subtotal,
        tax=tax,
        total=total
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    if quotation:
        for line in quotation.lines:
            qty = float(line.quantity)
            u_price = float(line.unit_price) if line.unit_price is not None else 0.0
            disc = float(line.discount_percent) if line.discount_percent is not None else 0.0
            inv_line = InvoiceLine(
                invoice_id=inv.id,
                description=line.product.name if line.product else "Item",
                quantity=line.quantity,
                unit_price=u_price,
                amount=round(qty * u_price * (1 - disc / 100.0), 2)
            )
            db.add(inv_line)
        db.commit()

    return inv
