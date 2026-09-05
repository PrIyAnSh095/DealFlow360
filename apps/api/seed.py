"""Seed a complete, repeatable development dataset for the DealFlow360 UI."""

import os
import sys
from datetime import datetime, timedelta, timezone
from decimal import Decimal

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.core.database import SessionLocal
from src.core.security import get_password_hash
from src.models.admin import (
    ApprovalChain,
    ApprovalRule,
    Category,
    CustomerTier,
    DiscountPolicy,
    GlobalSetting,
    PricingRule,
    SubscriptionPlan,
)
from src.models.approval import ApprovalAuditLog, ApprovalRequest
from src.models.audit import AuditLog
from src.models.billing import Invoice, InvoiceLine, Payment, Subscription
from src.models.customer import Customer
from src.models.deal import Deal
from src.models.operations import FulfillmentAllocation, Order, Stock, Warehouse
from src.models.portal import QuoteMessage
from src.models.product import Product
from src.models.quotation import QuoteLine, Quotation
from src.models.user import User


SEED_USERS = [
    ("00000000-0000-4000-8000-000000000001", "DealFlow Admin", "admin@dealflow360.com", "Admin123!", "admin"),
    ("00000000-0000-4000-8000-000000000002", "DealFlow Finance", "finance@dealflow360.com", "Finance123!", "finance"),
    ("00000000-0000-4000-8000-000000000003", "DealFlow Sales Rep", "sales.rep@dealflow360.com", "SalesRep123!", "sales_rep"),
    ("00000000-0000-4000-8000-000000000004", "DealFlow Sales Manager", "sales.manager@dealflow360.com", "SalesManager123!", "sales_manager"),
    ("00000000-0000-4000-8000-000000000005", "DealFlow Customer", "customer@dealflow360.com", "Customer123!", "customer"),
]


def get_or_create(db, model, identity, values):
    row = db.query(model).filter_by(**identity).one_or_none()
    if row is None:
        row = model(**values)
        db.add(row)
        db.flush()
    else:
        for key, value in values.items():
            setattr(row, key, value)
    return row


def seed_db() -> None:
    db = SessionLocal()
    try:
        users = {}
        for user_id, name, email, password, role in SEED_USERS:
            users[role] = get_or_create(
                db,
                User,
                {"email": email},
                {
                    "id": user_id,
                    "name": name,
                    "email": email,
                    "password_hash": get_password_hash(password),
                    "role": role,
                    "is_active": True,
                },
            )

        customers = {}
        for key, name, email, company, tier in [
            ("primary", "Acme Customer", "customer@dealflow360.com", "Acme Corporation", "enterprise"),
            ("secondary", "Globex Buyer", "buyer@globex.example.com", "Globex Ltd", "standard"),
            ("third", "Nexus Buyer", "buyer@nexus.example.com", "Nexus Systems", "premium"),
        ]:
            customers[key] = get_or_create(
                db, Customer, {"email": email},
                {"name": name, "email": email, "company": company, "tier": tier},
            )

        products = {}
        for key, name, sku, category, price, cost in [
            ("laptop", "Pro Laptop 16", "LAP-PRO-16", "hardware", "150000", "120000"),
            ("support", "Premium Support", "SRV-SUPPORT-1", "service", "25000", "5000"),
            ("gateway", "Secure Gateway", "NET-GATEWAY-1", "software", "85000", "42000"),
            ("subscription", "Analytics Cloud", "SUB-ANALYTICS-1", "subscription", "12000", "3000"),
        ]:
            products[key] = get_or_create(
                db, Product, {"sku": sku},
                {"name": name, "sku": sku, "category": category, "sales_price": Decimal(price), "cost": Decimal(cost), "active": True},
            )

        for name, description in [
            ("Hardware", "Physical equipment"),
            ("Software", "Licensed software"),
            ("Services", "Implementation and support services"),
        ]:
            get_or_create(db, Category, {"name": name}, {"name": name, "description": description, "is_active": True})
        for name, discount in [("Standard", "5"), ("Premium", "10"), ("Enterprise", "15")]:
            get_or_create(db, CustomerTier, {"name": name}, {"name": name, "baseline_discount": Decimal(discount), "is_active": True})

        for name, role, max_discount, approval_above in [
            ("Sales Rep Standard", "sales_rep", "10", "10"),
            ("Manager Strategic", "sales_manager", "20", "15"),
            ("Finance Exception", "finance", "25", "20"),
        ]:
            get_or_create(db, PricingRule, {"name": name}, {"name": name, "target_role": role, "max_discount_percent": Decimal(max_discount), "requires_approval_above": Decimal(approval_above), "is_active": True})
        get_or_create(db, DiscountPolicy, {"name": "Enterprise Hardware Policy"}, {"name": "Enterprise Hardware Policy", "target_tier": "enterprise", "target_category": "hardware", "max_discount_percent": Decimal("15"), "min_margin_percent": Decimal("20"), "is_active": True})
        get_or_create(db, ApprovalRule, {"name": "High Discount Approval"}, {"name": "High Discount Approval", "risk_threshold": "high", "discount_threshold": Decimal("15"), "target_role": "sales_manager", "is_active": True})
        get_or_create(db, ApprovalChain, {"name": "Standard Approval Chain"}, {"name": "Standard Approval Chain", "sequence": "sales_manager,finance", "is_active": True})
        get_or_create(db, SubscriptionPlan, {"name": "Analytics Monthly"}, {"name": "Analytics Monthly", "description": "Monthly analytics subscription", "interval": "month", "price": Decimal("12000"), "is_active": True})
        for key, value, description in [
            ("company_name", "DealFlow360", "Company name shown on documents"),
            ("default_currency", "INR", "Default display currency"),
            ("quote_validity_days", "30", "Quotation validity period"),
        ]:
            get_or_create(db, GlobalSetting, {"key": key}, {"key": key, "value": value, "description": description})

        deals = {}
        for key, customer_key, value, status, risk in [
            ("draft", "primary", "250000", "draft", "low"),
            ("negotiation", "secondary", "425000", "negotiation", "medium"),
            ("approval", "third", "850000", "approval", "high"),
            ("won", "primary", "150000", "won", "low"),
        ]:
            deals[key] = get_or_create(
                db, Deal, {"id": f"10000000-0000-4000-8000-00000000000{len(deals) + 1}"},
                {"id": f"10000000-0000-4000-8000-00000000000{len(deals) + 1}", "customer_id": customers[customer_key].id, "value": Decimal(value), "status": status, "risk": risk},
            )

        quotations = {}
        quote_specs = [
            ("draft", deals["draft"], "DRAFT", products["gateway"], 2, "0", "150000", "100000", "LOW", False),
            ("negotiation", deals["negotiation"], "NEGOTIATION", products["laptop"], 2, "10", "270000", "180000", "MEDIUM", False),
            ("approval", deals["approval"], "PENDING_APPROVAL", products["laptop"], 5, "20", "600000", "300000", "HIGH", True),
        ]
        for key, deal, status, product, quantity, discount, subtotal, total, risk, requires_approval in quote_specs:
            quotation_id = f"20000000-0000-4000-8000-00000000000{len(quotations) + 1}"
            quotations[key] = get_or_create(
                db, Quotation, {"id": quotation_id},
                {"id": quotation_id, "deal_id": deal.id, "status": status, "subtotal": Decimal(subtotal), "total_discount": Decimal(subtotal) - Decimal(total), "total": Decimal(total), "margin_percentage": Decimal("25"), "risk_score": risk, "requires_approval": requires_approval},
            )
            line_id = f"21000000-0000-4000-8000-00000000000{len(quotations)}"
            get_or_create(db, QuoteLine, {"id": line_id}, {"id": line_id, "quotation_id": quotation_id, "product_id": product.id, "quantity": quantity, "unit_price": product.sales_price, "discount_percent": Decimal(discount)})

        approval_id = "30000000-0000-4000-8000-000000000001"
        approval = get_or_create(db, ApprovalRequest, {"id": approval_id}, {"id": approval_id, "quotation_id": quotations["approval"].id, "requester_id": users["sales_rep"].id, "status": "PENDING"})
        get_or_create(db, ApprovalAuditLog, {"id": "31000000-0000-4000-8000-000000000001"}, {"id": "31000000-0000-4000-8000-000000000001", "approval_request_id": approval.id, "actor_id": users["sales_rep"].id, "action": "SUBMITTED", "reason": "Discount requires approval"})

        warehouses = {}
        for key, name, location in [("east", "East Coast Hub", "New York"), ("west", "West Coast Hub", "San Francisco")]:
            warehouse_id = f"40000000-0000-4000-8000-00000000000{len(warehouses) + 1}"
            warehouses[key] = get_or_create(db, Warehouse, {"id": warehouse_id}, {"id": warehouse_id, "name": name, "location": location})
        get_or_create(db, Stock, {"product_id": products["laptop"].id, "warehouse_id": warehouses["east"].id}, {"product_id": products["laptop"].id, "warehouse_id": warehouses["east"].id, "quantity_on_hand": 25, "quantity_allocated": 5})
        get_or_create(db, Stock, {"product_id": products["gateway"].id, "warehouse_id": warehouses["west"].id}, {"product_id": products["gateway"].id, "warehouse_id": warehouses["west"].id, "quantity_on_hand": 12, "quantity_allocated": 2})

        order = get_or_create(db, Order, {"quotation_id": quotations["negotiation"].id}, {"quotation_id": quotations["negotiation"].id, "status": "pending_fulfillment"})
        quote_line = db.query(QuoteLine).filter(QuoteLine.quotation_id == quotations["negotiation"].id).first()
        if quote_line:
            get_or_create(db, FulfillmentAllocation, {"order_id": order.id, "quote_line_id": quote_line.id}, {"order_id": order.id, "quote_line_id": quote_line.id, "warehouse_id": warehouses["east"].id, "quantity": 2})

        invoice = get_or_create(db, Invoice, {"order_id": order.id}, {"order_id": order.id, "customer_id": customers["secondary"].id, "status": "open", "payment_status": "partially_paid", "subtotal": Decimal("486000"), "total_discount": Decimal("27000"), "tax": Decimal("0"), "total": Decimal("459000"), "amount_paid": Decimal("100000"), "due_date": datetime.now(timezone.utc) + timedelta(days=15)})
        get_or_create(db, InvoiceLine, {"invoice_id": invoice.id, "product_id": products["laptop"].id}, {"invoice_id": invoice.id, "product_id": products["laptop"].id, "description": "Pro Laptop 16", "quantity": 2, "unit_price": Decimal("243000"), "amount": Decimal("486000")})
        get_or_create(db, Payment, {"invoice_id": invoice.id}, {"invoice_id": invoice.id, "amount": Decimal("100000"), "method": "bank_transfer", "status": "succeeded"})
        get_or_create(db, Subscription, {"order_id": order.id}, {"order_id": order.id, "customer_id": customers["secondary"].id, "product_id": products["subscription"].id, "status": "active", "interval": "month", "quantity": 1, "price_per_period": Decimal("12000"), "current_period_end": datetime.now(timezone.utc) + timedelta(days=30)})

        get_or_create(db, QuoteMessage, {"id": "50000000-0000-4000-8000-000000000001"}, {"id": "50000000-0000-4000-8000-000000000001", "quotation_id": quotations["negotiation"].id, "sender_type": "CUSTOMER", "content": "Can we review the discount for the next renewal?"})
        get_or_create(db, AuditLog, {"id": "60000000-0000-4000-8000-000000000001"}, {"id": "60000000-0000-4000-8000-000000000001", "actor_id": users["admin"].id, "action": "SEED_DATA", "entity_type": "SYSTEM", "entity_id": "development", "details": {"dataset": "complete-development"}})

        db.commit()
        print("Seeded complete development dataset.")
        print("Users: admin@dealflow360.com / Admin123!, sales.rep@dealflow360.com / SalesRep123!, customer@dealflow360.com / Customer123!")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_db()
