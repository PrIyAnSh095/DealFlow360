import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.database import SessionLocal, Base, engine
from src.models.user import User
from src.models.customer import CustomerTier, Customer
from src.models.product import Product
from src.models.pricing import Category, PriceList, PriceListItem, DiscountPolicy, ApprovalRule
from src.models.deal import Deal
from src.models.quotation import Quotation, QuoteLine
from src.models.approval import ApprovalRequest, ApprovalAuditLog
from src.models.operations import Warehouse, Stock, Order, FulfillmentAllocation
from src.models.billing import SubscriptionPlan, Subscription, SubscriptionLine, BillingScheduleItem, Invoice, InvoiceLine, Payment
from src.models.audit import AuditEvent
from src.models.ai_config import CompanyAIConfig
from src.core.security import get_password_hash

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    print("Checking database seed state...")
    
    # 0. Seed Company AI Config
    if db.query(CompanyAIConfig).count() == 0:
        print("Seeding company AI configuration...")
        cfg = CompanyAIConfig(id="default-config", provider="ollama", model_name="llama3", enabled=True)
        db.add(cfg)
        db.commit()

    # 1. Seed Users (RBAC: sales, manager, finance, admin, customer)

    if db.query(User).count() == 0:
        print("Seeding users...")
        users = [
            User(id="u-admin", email="admin@dealflow360.com", name="System Admin", hashed_password=get_password_hash("admin123"), role="admin"),
            User(id="u-sales-1", email="sales@dealflow360.com", name="Sarah Rep", hashed_password=get_password_hash("sales123"), role="sales"),
            User(id="u-mgr-1", email="manager@dealflow360.com", name="Michael Manager", hashed_password=get_password_hash("manager123"), role="manager"),
            User(id="u-fin-1", email="finance@dealflow360.com", name="Fiona Finance", hashed_password=get_password_hash("finance123"), role="finance"),
            User(id="u-cust-1", email="customer@acme.com", name="Charlie Customer", hashed_password=get_password_hash("customer123"), role="customer"),
        ]
        db.add_all(users)
        db.commit()

    # 2. Seed Customer Tiers & Customers
    if db.query(CustomerTier).count() == 0:
        print("Seeding customer tiers...")
        t_bronze = CustomerTier(id="tier-bronze", name="Bronze", min_spend=0.0, max_discount_pct=10.0)
        t_silver = CustomerTier(id="tier-silver", name="Silver", min_spend=50000.0, max_discount_pct=15.0)
        t_gold = CustomerTier(id="tier-gold", name="Gold", min_spend=150000.0, max_discount_pct=25.0)
        db.add_all([t_bronze, t_silver, t_gold])
        db.commit()

        c1 = Customer(id="c-acme", name="Acme Corporation", email="purchasing@acme.com", company="Acme Corp", tier_id="tier-gold")
        c2 = Customer(id="c-globex", name="Globex Inc", email="procurement@globex.com", company="Globex Inc", tier_id="tier-silver")
        c3 = Customer(id="c-soylent", name="Soylent Corp", email="contact@soylent.com", company="Soylent Corp", tier_id="tier-bronze")
        db.add_all([c1, c2, c3])
        db.commit()

    # 3. Seed Categories & Products
    if db.query(Category).count() == 0:
        print("Seeding categories & products...")
        cat_hw = Category(id="cat-hw", name="Hardware", description="Enterprise Physical Servers & Workstations")
        cat_sw = Category(id="cat-sw", name="Software", description="SaaS Subscriptions & Licenses")
        cat_sv = Category(id="cat-sv", name="Services", description="Professional Implementation & Support")
        db.add_all([cat_hw, cat_sw, cat_sv])
        db.commit()

        products = [
            Product(id="p-1", name="Enterprise Server XL", sku="HW-SRV-XL", category="cat-hw", sales_price=15000.0, cost=10000.0),
            Product(id="p-2", name="Cloud Storage 10TB (Monthly)", sku="SW-CLD-10", category="cat-sw", sales_price=5000.0, cost=1000.0),
            Product(id="p-3", name="Implementation Service", sku="SV-IMP-01", category="cat-sv", sales_price=2000.0, cost=1500.0),
            Product(id="p-4", name="Premium Support (1Y)", sku="SV-SUP-01", category="cat-sv", sales_price=1200.0, cost=800.0),
        ]
        db.add_all(products)
        db.commit()

    # 4. Seed Warehouses & Multi-Warehouse Stock
    if db.query(Warehouse).count() == 0:
        print("Seeding warehouses & stock...")
        w1 = Warehouse(id="w-1", name="East Coast Hub (NY)", location="New York, NY")
        w2 = Warehouse(id="w-2", name="West Coast Hub (SF)", location="San Francisco, CA")
        w3 = Warehouse(id="w-3", name="Central Hub (Chicago)", location="Chicago, IL")
        db.add_all([w1, w2, w3])
        db.commit()

        stocks = [
            Stock(id="s-1", product_id="p-1", warehouse_id="w-1", quantity_on_hand=6, quantity_allocated=0),
            Stock(id="s-2", product_id="p-1", warehouse_id="w-2", quantity_on_hand=7, quantity_allocated=0),
            Stock(id="s-3", product_id="p-1", warehouse_id="w-3", quantity_on_hand=10, quantity_allocated=0),
            Stock(id="s-4", product_id="p-2", warehouse_id="w-1", quantity_on_hand=50, quantity_allocated=0),
            Stock(id="s-5", product_id="p-2", warehouse_id="w-2", quantity_on_hand=20, quantity_allocated=0),
            Stock(id="s-6", product_id="p-3", warehouse_id="w-1", quantity_on_hand=100, quantity_allocated=0),
            Stock(id="s-7", product_id="p-4", warehouse_id="w-1", quantity_on_hand=100, quantity_allocated=0),
        ]
        db.add_all(stocks)
        db.commit()

    # 5. Seed Deals, Quotations, Approvals & Orders
    if db.query(Deal).count() == 0:
        print("Seeding deals, quotes & approvals...")
        d1 = Deal(id="d-1", customer_name="Acme Corp", value=22000.0, status="approval", risk="high")
        d2 = Deal(id="d-2", customer_name="Globex Inc", value=15000.0, status="review", risk="low")
        d3 = Deal(id="d-3", customer_name="Soylent Corp", value=5000.0, status="draft", risk="low")
        d_ops = Deal(id="d-ops", customer_name="Wayne Enterprises", value=50000.0, status="won", risk="low")
        db.add_all([d1, d2, d3, d_ops])
        db.commit()

        q1 = Quotation(
            id="q-1",
            deal_id="d-1",
            status="PENDING_APPROVAL",
            subtotal=15000.0,
            total_discount=3750.0,
            total=11250.0,
            margin_percentage=11.11,
            risk_score="HIGH",
            requires_approval=True
        )
        ql1 = QuoteLine(id="ql-1", quotation_id="q-1", product_id="p-1", quantity=1, unit_price=15000.0, discount_percent=25.0)
        app1 = ApprovalRequest(id="a-1", quotation_id="q-1", requester_id="u-sales-1", status="PENDING")
        db.add_all([q1, ql1, app1])

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
        ql_ops = QuoteLine(id="ql-ops-1", quotation_id="q-ops", product_id="p-1", quantity=12, unit_price=2000.0, discount_percent=0.0)
        order_ops = Order(id="o-ops-1", quotation_id="q-ops", status="pending_fulfillment")
        db.add_all([q_ops, ql_ops, order_ops])
        db.commit()

    # 6. Seed Subscriptions & Invoices
    if db.query(SubscriptionPlan).count() == 0:
        print("Seeding subscription plans & invoices...")
        sp1 = SubscriptionPlan(id="sp-ent", name="Enterprise Cloud Plan", billing_cycle="monthly", price=5000.0)
        sp2 = SubscriptionPlan(id="sp-std", name="Standard Cloud Plan", billing_cycle="monthly", price=1500.0)
        db.add_all([sp1, sp2])
        db.commit()

        sub = Subscription(id="sub-1", customer_id="c-acme", plan_id="sp-ent", status="ACTIVE")
        db.add(sub)
        db.commit()

        inv = Invoice(id="inv-1", order_id="o-ops-1", customer_id="c-acme", status="UNPAID", subtotal=50000.0, tax=9000.0, total=59000.0)
        inv_line = InvoiceLine(id="il-1", invoice_id="inv-1", description="Enterprise Servers (12 Units)", quantity=12, unit_price=2000.0, amount=50000.0)
        db.add_all([inv, inv_line])
        db.commit()

    # 7. Seed Audit Events
    if db.query(AuditEvent).count() == 0:
        print("Seeding audit events...")
        ae1 = AuditEvent(id="ae-1", user_id="u-sales-1", action="QUOTE_CREATED", entity_type="Quotation", entity_id="q-1", details="Created quotation q-1 with high risk score")
        ae2 = AuditEvent(id="ae-2", user_id="u-sales-1", action="APPROVAL_SUBMITTED", entity_type="ApprovalRequest", entity_id="a-1", details="Submitted q-1 for manager approval")
        db.add_all([ae1, ae2])
        db.commit()

    db.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_db()
