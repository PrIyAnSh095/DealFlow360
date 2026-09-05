import sys
import os
import uuid
from decimal import Decimal
from datetime import datetime, timedelta

# Append the directory above `apps/api` so we can import `src`
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.core.database import SessionLocal, Base, engine
from src.core.security import get_password_hash
from src.models.user import User
from src.models.customer import Customer
from src.models.deal import Deal
from src.models.approval import ApprovalRequest, ApprovalAuditLog
from src.models.product import Product
from src.models.quotation import Quotation, QuoteLine

def seed_db():
    db = SessionLocal()
    
    # 1. Create Users
    admin_pw = get_password_hash("admin123")
    user = db.query(User).filter(User.email == "admin@dealflow360.com").first()
    if not user:
        user = User(
            name="Admin User",
            email="admin@dealflow360.com",
            password_hash=admin_pw,
            role="admin"
        )
        db.add(user)
    
    finance = db.query(User).filter(User.email == "finance@dealflow360.com").first()
    if not finance:
        finance = User(
            name="Finance Ops",
            email="finance@dealflow360.com",
            password_hash=get_password_hash("finance123"),
            role="finance"
        )
        db.add(finance)
        
    sales_rep = db.query(User).filter(User.email == "sales@dealflow360.com").first()
    if not sales_rep:
        sales_rep = User(
            name="Sales Rep",
            email="sales@dealflow360.com",
            password_hash=get_password_hash("sales123"),
            role="sales_rep"
        )
        db.add(sales_rep)

    customer_user = db.query(User).filter(User.email == "customer@acme.com").first()
    if not customer_user:
        customer_user = User(
            name="Acme Corp Admin",
            email="customer@acme.com",
            password_hash=get_password_hash("customer123"),
            role="customer"
        )
        db.add(customer_user)
        
    db.commit()

    # 2. Create Customer Profile
    customer = db.query(Customer).filter(Customer.email == "customer@acme.com").first()
    if not customer:
        customer = Customer(
            name="Acme Corp",
            email="customer@acme.com",
            company="Acme Corporation",
            tier="enterprise"
        )
        db.add(customer)
        db.commit()

    # 3. Create Products
    p1 = db.query(Product).filter(Product.sku == "LAP-PRO-16").first()
    if not p1:
        p1 = Product(name="Pro Laptop 16 inch", sku="LAP-PRO-16", category="hardware", sales_price=Decimal("150000"), cost=Decimal("120000"))
        db.add(p1)
    
    p2 = db.query(Product).filter(Product.sku == "SRV-L1").first()
    if not p2:
        p2 = Product(name="Premium Support L1", sku="SRV-L1", category="service", sales_price=Decimal("25000"), cost=Decimal("5000"))
        db.add(p2)

    db.commit()

    # 4. Create Deals
    d1 = Deal(
        customer_id=customer.id,
        value=Decimal("850000.00"),
        status="discovery",
        risk="low"
    )
    d2 = Deal(
        customer_id=customer.id,
        value=Decimal("1200000.00"),
        status="approval",
        risk="high"
    )
    db.add(d1)
    db.add(d2)
    db.commit()

    # 5. Create Quotation and Approval for Deal 2
    q2 = Quotation(
        deal_id=d2.id,
        status="PENDING_APPROVAL",
        total=Decimal("1000000.00"),
        subtotal=Decimal("1200000.00"),
        total_discount=Decimal("200000.00"),
        margin_percentage=Decimal("15.00")
    )
    db.add(q2)
    db.commit()
    
    ql1 = QuoteLine(
        quotation_id=q2.id,
        product_id=p1.id,
        quantity=10,
        unit_price=Decimal("150000.00"),
        discount_percent=Decimal("20.00")
    )
    db.add(ql1)
    db.commit()

    # 6. Create Approval Request
    ar = ApprovalRequest(
        quotation_id=q2.id,
        requester_id=sales_rep.id,
        status="PENDING"
    )
    db.add(ar)
    db.commit()

    # 7. Add Audit Log
    log = ApprovalAuditLog(
        approval_request_id=ar.id,
        actor_id=sales_rep.id,
        action="REQUESTED",
        reason="Please approve, key account."
    )
    db.add(log)
    db.commit()

    print("Database seeded successfully with valid users, products, deals, and approvals.")

if __name__ == "__main__":
    seed_db()
