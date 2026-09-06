import uuid
from src.core.database import SessionLocal
from src.core.security import get_password_hash
from src.models.user import User

db = SessionLocal()

if db.query(User).count() == 0:
    print("Seeding users...")
    users = [
        User(id="u-admin", email="admin@dealflow360.com", name="System Admin", password_hash=get_password_hash("admin123"), role="admin"),
        User(id="u-sales-1", email="sales@dealflow360.com", name="Sarah Rep", password_hash=get_password_hash("sales123"), role="sales"),
        User(id="u-mgr-1", email="manager@dealflow360.com", name="Michael Manager", password_hash=get_password_hash("manager123"), role="manager"),
        User(id="u-fin-1", email="finance@dealflow360.com", name="Fiona Finance", password_hash=get_password_hash("finance123"), role="finance"),
        User(id="u-cust-1", email="customer@acme.com", name="Charlie Customer", password_hash=get_password_hash("customer123"), role="customer"),
        User(id="u-sales-mgr", email="sales.manager@dealflow360.com", name="Sales Manager", password_hash=get_password_hash("password123"), role="manager"),
    ]
    db.add_all(users)
    db.commit()
    print("Users seeded successfully!")
else:
    print("Users already exist.")
