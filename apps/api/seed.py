"""
DealFlow360 — Demo Seed Script
================================
Creates a small set of demo users for development/testing.

Usage:
    cd apps/api
    python seed.py

Requirements:
    - The database must already exist and `alembic upgrade head` must have been run.
    - DATABASE_URL and AUTH_SECRET must be set in ../../.env or the environment.

Security notes:
    - Passwords are hashed with bcrypt before insertion.
    - Plain-text passwords are only held in memory during this script and
      are never written to disk or logged.
    - Do NOT use these passwords in production.
"""
import sys
import os

# Make the src package importable when running from apps/api/
sys.path.insert(0, os.path.dirname(__file__))

from src.core.database import SessionLocal
from src.core.security import get_password_hash
from src.models.user import User  # noqa: F401 — needed so the mapper is registered


DEMO_USERS = [
    {
        "name": "Admin User",
        "email": "admin@dealflow360.dev",
        "password": "Admin@12345!",
        "role": "admin",
        "is_active": True,
    },
    {
        "name": "Alice Manager",
        "email": "alice@dealflow360.dev",
        "password": "Manager@12345!",
        "role": "sales_manager",
        "is_active": True,
    },
    {
        "name": "Bob Rep",
        "email": "bob@dealflow360.dev",
        "password": "SalesRep@12345!",
        "role": "sales_rep",
        "is_active": True,
    },
    {
        "name": "Carol Finance",
        "email": "carol@dealflow360.dev",
        "password": "Finance@12345!",
        "role": "finance",
        "is_active": True,
    },
    {
        "name": "Demo Customer",
        "email": "customer@dealflow360.dev",
        "password": "Customer@12345!",
        "role": "customer",
        "is_active": True,
    },
]


def seed() -> None:
    db = SessionLocal()
    created = 0
    skipped = 0

    try:
        for data in DEMO_USERS:
            email = data["email"].lower()
            exists = db.query(User).filter(User.email == email).first()
            if exists:
                print(f"  [skip]    {email} already exists")
                skipped += 1
                continue

            user = User(
                name=data["name"],
                email=email,
                password_hash=get_password_hash(data["password"]),
                role=data["role"],
                is_active=data["is_active"],
            )
            db.add(user)
            print(f"  [create]  {email} ({data['role']})")
            created += 1

        db.commit()
        print(f"\n✓ Seed complete — {created} created, {skipped} skipped.")

    except Exception as exc:
        db.rollback()
        print(f"\n✗ Seed failed: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding DealFlow360 demo users...\n")
    seed()
