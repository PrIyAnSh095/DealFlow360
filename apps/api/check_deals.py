from src.core.database import SessionLocal
from src.models.deal import Deal

db = SessionLocal()
try:
    deals = db.query(Deal).all()
    print(f"Successfully fetched {len(deals)} deals!")
except Exception as e:
    print(f"Error fetching deals: {e}")
