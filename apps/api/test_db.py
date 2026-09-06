from src.core.database import SessionLocal
from src.models.user import User

db = SessionLocal()
users = db.query(User).all()
for u in users:
    print(f"ID: {u.id}, Email: {u.email}, Role: {u.role}")
