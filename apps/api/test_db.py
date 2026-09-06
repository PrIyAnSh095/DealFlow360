from src.core.database import SessionLocal
from src.models.user import User
from src.services.audit_service import log_audit_event

db = SessionLocal()
try:
    user = db.query(User).filter(User.email == "admin@dealflow360.com").first()
    print("User:", user)
    print("Has password_hash:", hasattr(user, 'password_hash'))
    print("Has hashed_password:", hasattr(user, 'hashed_password'))
    
    # Try audit log
    if user:
        log_audit_event(
            db,
            user_id=user.id,
            action="USER_LOGIN",
            entity_type="User",
            entity_id=user.id,
            details="User logged in successfully"
        )
        print("Audit logged")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
