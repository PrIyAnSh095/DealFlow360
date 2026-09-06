from src.core.database import SessionLocal
from src.core.security import get_password_hash
from src.models.user import User

db = SessionLocal()
users = db.query(User).all()
new_hash = get_password_hash("password123")
for u in users:
    u.password_hash = new_hash
db.commit()
print("All passwords updated to 'password123'")
