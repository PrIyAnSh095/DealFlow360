import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.database import SessionLocal, Base, engine
from src.models.product import Product
from src.models.deal import Deal
from src.models.user import User
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
            Product(name="Enterprise Server XL", sku="HW-SRV-XL", category="hardware", sales_price=15000.0, cost=10000.0),
            Product(name="Cloud Storage 10TB", sku="SW-CLD-10", category="software", sales_price=5000.0, cost=1000.0),
            Product(name="Implementation Service", sku="SV-IMP-01", category="service", sales_price=2000.0, cost=1500.0),
            Product(name="Premium Support (1Y)", sku="SV-SUP-01", category="service", sales_price=1200.0, cost=800.0),
        ]
        db.add_all(products)
        
    # 2. Add some mock deals if empty
    if db.query(Deal).count() == 0:
        print("Seeding mock deals...")
        deals = [
            Deal(customer_name="Acme Corp", value=22000.0, status="Negotiation", risk="low"),
            Deal(customer_name="Globex Inc", value=15000.0, status="Review", risk="high"),
            Deal(customer_name="Soylent Corp", value=5000.0, status="Draft", risk="low"),
        ]
        db.add_all(deals)
        
    db.commit()
    db.close()
    print("Seeding complete.")

if __name__ == "__main__":
    seed_db()
