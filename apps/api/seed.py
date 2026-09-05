import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.database import SessionLocal, Base, engine
from src.models.product import Product
from src.models.deal import Deal
from src.models.user import User
from src.models.customer import Customer
from src.models.quotation import Quotation, QuoteLine
from src.models.approval import ApprovalRequest
from src.models.operations import Warehouse, Stock, Order
from src.core.security import get_password_hash

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # 1. Check if we already have users, if not create admin
    if db.query(User).count() == 0:
        print("Seeding admin user...")
        admin = User(
            email="admin@dealflow360.com",
            hashed_password=get_password_hash("admin"),
            name="Admin User",
            role="manager"
        )
        db.add(admin)
        db.commit()

    # 2. Check if we already have products
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
        
    if db.query(Customer).count() == 0:
        print("Seeding mock customers...")
        customers = [
            Customer(id="c-1", name="John Doe", email="john@acme.com", company="Acme Corp"),
            Customer(id="c-2", name="Jane Smith", email="jane@globex.com", company="Globex Inc"),
            Customer(id="c-3", name="Bob Jones", email="bob@soylent.com", company="Soylent Corp"),
            Customer(id="c-4", name="Bruce Wayne", email="bruce@wayne.com", company="Wayne Enterprises"),
        ]
        db.add_all(customers)
        db.commit()

    # 2. Add some mock deals if empty
    if db.query(Deal).count() == 0:
        print("Seeding mock deals...")
        deals = [
            Deal(id="d-1", customer_id="c-1", value=22000.0, status="approval", risk="high"),
            Deal(id="d-2", customer_id="c-2", value=15000.0, status="review", risk="low"),
            Deal(id="d-3", customer_id="c-3", value=5000.0, status="draft", risk="low"),
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
    # --- Step 4: Operations / Fulfillment ---
    from src.models.operations import Warehouse, Stock, Order
    if db.query(Warehouse).count() == 0:
        print("Seeding mock warehouses and stock...")
        w1 = Warehouse(id="w-1", name="East Coast Hub", location="New York, NY")
        w2 = Warehouse(id="w-2", name="West Coast Hub", location="San Francisco, CA")
        db.add_all([w1, w2])
        
        # Add random stock for products
        all_products = db.query(Product).all()
        for p in all_products:
            db.add(Stock(product_id=p.id, warehouse_id="w-1", quantity_on_hand=15))
            db.add(Stock(product_id=p.id, warehouse_id="w-2", quantity_on_hand=5))
            
        # Create an Order for q-1 if it was ACCEPTED (we will mock it as pending_fulfillment)
        # Wait, q-1 is PENDING in the mock approval. 
        # For Phase 8, let's create a NEW deal, quote, and order to test fulfillment directly!
        
        # Mock Deal for Operations
        d_ops = Deal(id="d-ops", customer_id="c-4", value=50000.0, status="won", risk="low")
        db.add(d_ops)
        
        q_ops = Quotation(
            id="q-ops",
            deal_id="d-ops",
            status="ACCEPTED",
            subtotal=50000.0,
            total_discount=0.0,
            total=50000.0,
            margin_percentage=40.0,
            risk_score="LOW",
            requires_approval=False
        )
        db.add(q_ops)
        
        ql_ops = QuoteLine(
            id="ql-ops-1",
            quotation_id="q-ops",
            product_id="p-1", # MacBook Pro
            quantity=12,
            unit_price=2000.0,
            discount_percent=0.0
        )
        db.add(ql_ops)
        
        o_ops = Order(
            id="o-ops-1",
            quotation_id="q-ops",
            status="pending_fulfillment"
        )
        db.add(o_ops)
        
        db.commit()

    print("Seeding complete.")
if __name__ == "__main__":
    seed_db()
