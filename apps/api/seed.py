"""Seed the local database with the minimum accounts needed for development."""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.core.database import SessionLocal
from src.core.security import get_password_hash
from src.models.customer import Customer
from src.models.deal import Deal
from src.models.user import User


SEED_USERS = [
    {
        "id": "00000000-0000-4000-8000-000000000001",
        "name": "DealFlow Admin",
        "email": "admin@dealflow360.com",
        "password": "Admin123!",
        "role": "admin",
    },
    {
        "id": "00000000-0000-4000-8000-000000000002",
        "name": "DealFlow Finance",
        "email": "finance@dealflow360.com",
        "password": "Finance123!",
        "role": "finance",
    },
    {
        "id": "00000000-0000-4000-8000-000000000003",
        "name": "DealFlow Sales Rep",
        "email": "sales.rep@dealflow360.com",
        "password": "SalesRep123!",
        "role": "sales_rep",
    },
    {
        "id": "00000000-0000-4000-8000-000000000004",
        "name": "DealFlow Sales Manager",
        "email": "sales.manager@dealflow360.com",
        "password": "SalesManager123!",
        "role": "sales_manager",
    },
    {
        "id": "00000000-0000-4000-8000-000000000005",
        "name": "DealFlow Customer",
        "email": "customer@dealflow360.com",
        "password": "Customer123!",
        "role": "customer",
    },
]


def seed_db() -> None:
    db = SessionLocal()
    try:
        users_by_role = {}
        for seed_user in SEED_USERS:
            user = db.query(User).filter(User.email == seed_user["email"]).one_or_none()
            if user is None:
                user = User(
                    id=seed_user["id"],
                    name=seed_user["name"],
                    email=seed_user["email"],
                    password_hash=get_password_hash(seed_user["password"]),
                    role=seed_user["role"],
                    is_active=True,
                )
                db.add(user)
            else:
                user.id = seed_user["id"]
                user.name = seed_user["name"]
                user.role = seed_user["role"]
                user.is_active = True
                user.password_hash = get_password_hash(seed_user["password"])
            users_by_role[seed_user["role"]] = user

        db.flush()

        customer_user = users_by_role["customer"]
        customer = db.query(Customer).filter(Customer.email == customer_user.email).one_or_none()
        if customer is None:
            db.add(
                Customer(
                    name=customer_user.name,
                    email=customer_user.email,
                    company="DealFlow Customer Company",
                    tier="standard",
                )
            )

        db.commit()
        print("Seeded 5 users (one per role) and 1 customer profile.")
        for seed_user in SEED_USERS:
            print(
                f'{seed_user["role"]}: {seed_user["id"]} | '
                f'{seed_user["email"]} | {seed_user["password"]}'
            )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_db()
