import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.database import SessionLocal, Base, engine
from src.models.product import Product
from src.models.deal import Deal
from src.models.user import User
from src.models.quotation import Quotation, QuoteLine
from src.models.approval import ApprovalRequest
from src.core.security import get_password_hash

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # 1. Check if we already have products
    if db.query(Product).count() > 0:
        print("Database already seeded with products!")
        
    else:
        print("Seeding products...")
        products = [
            Product(id="p-1", name="Enterprise Server XL", sku="HW-SRV-XL", category="hardware", sales_price=15000.0, cost=10000.0),
            Product(id="p-2", name="Cloud Storage 10TB", sku="SW-CLD-10", category="software", sales_price=5000.0, cost=1000.0),
            Product(id="p-3", name="Implementation Service", sku="SV-IMP-01", category="service", sales_price=2000.0, cost=1500.0),
            Product(id="p-4", name="Premium Support (1Y)", sku="SV-SUP-01", category="service", sales_price=1200.0, cost=800.0),
        ]
        db.add_all(products)
        
    # 2. Add some mock deals if empty
    if db.query(Deal).count() == 0:
        print("Seeding mock deals...")
        deals = [
            Deal(id="d-1", customer_name="Acme Corp", value=22000.0, status="approval", risk="high"),
            Deal(id="d-2", customer_name="Globex Inc", value=15000.0, status="review", risk="low"),
            Deal(id="d-3", customer_name="Soylent Corp", value=5000.0, status="draft", risk="low"),
        ]
        db.add_all(deals)
        
    # 3. Add a mock Quotation and Approval Request for the high-risk deal
    if db.query(ApprovalRequest).count() == 0:
        print("Seeding mock approval request...")
        user = db.query(User).first()
        user_id = user.id if user else "u-sys"
        
        q = Quotation(
            id="q-1",
            deal_id="d-1",
            status="PENDING",
            subtotal=15000.0,
            total_discount=3750.0, # 25% discount on hardware
            total=11250.0,
            margin_percentage=11.11,
            risk_score="HIGH",
            requires_approval=True
        )
        db.add(q)
        
        ql = QuoteLine(
            quotation_id="q-1",
            product_id="p-1", # Hardware
            quantity=1,
            unit_price=15000.0,
            discount_percent=25.0
        )
        db.add(ql)
        
        app_req = ApprovalRequest(
            id="a-1",
            quotation_id="q-1",
            requester_id=user_id,
            status="PENDING"
        )
        db.add(app_req)
        
    db.commit()
    db.close()
    print("Seeding complete.")

if __name__ == "__main__":
    seed_db()
