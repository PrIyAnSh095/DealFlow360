import sys
import os
import uuid
from decimal import Decimal
from datetime import datetime, timedelta

# Append the directory above `apps/api` so we can import `src`
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.core.database import SessionLocal, Base, engine
from src.core.security import get_password_hash
from src.models.user import User
from src.models.customer import CustomerTier, Customer
from src.models.product import Product
from src.models.pricing import Category, PriceList, PriceListItem, DiscountPolicy, ApprovalRule
from src.models.deal import Deal
from src.models.quotation import Quotation, QuoteLine
from src.models.approval import ApprovalRequest, ApprovalAuditLog
from src.models.operations import Warehouse, Stock, Order, FulfillmentAllocation, Backorder
from src.models.billing import SubscriptionPlan, Subscription, SubscriptionLine, BillingScheduleItem, Invoice, InvoiceLine, Payment
from src.models.portal import QuoteMessage
from src.models.audit import AuditEvent
from src.models.ai_config import CompanyAIConfig
from src.models.organization import OrganizationProfile

def seed_db():
    db = SessionLocal()
    
    print("Checking database seed state...")

    # 0A. Seed Organization Profile
    if db.query(OrganizationProfile).count() == 0:
        print("Seeding organization profile...")
        org = OrganizationProfile(
            id="org-default",
            company_name="DealFlow360 Enterprises",
            legal_name="DealFlow360 Technologies Private Limited",
            industry="Software & Enterprise IT Services",
            business_type="B2B Enterprise SaaS & Hardware",
            headquarters="San Francisco, CA",
            operating_regions="North America, Europe, Asia Pacific",
            countries_served="United States, Canada, United Kingdom, India",
            primary_currency="INR",
            timezone="Asia/Kolkata",
            business_description="Leading provider of enterprise B2B deal execution, quotation intelligence, and automated fulfillment solutions.",
            primary_sales_model="Hybrid (One-time Hardware & Recurring SaaS)",
            typical_deal_size="₹100,000 - ₹5,000,000",
            customer_loyalty_definition="Account age >= 2 years and total lifetime spend exceeding ₹1,500,000.",
            pricing_strategy="Value-based tiered pricing with strict target margin enforcement.",
            discount_philosophy="Sales reps permitted up to 10%. 10-25% requires Sales Manager approval. >25% requires Finance VP override.",
            margin_priority="Maintain minimum 15.0% gross margin on hardware and 70.0% on software subscriptions.",
            fulfillment_priority="Optimize for lowest shipping cost while meeting delivery commitments within 5 business days.",
            onboarding_completed=True
        )
        db.add(org)
        db.commit()

    # 0B. Seed Company AI Config
    if db.query(CompanyAIConfig).count() == 0:
        print("Seeding company AI configuration...")
        cfg = CompanyAIConfig(
            id="default-config",
            provider="ollama",
            model_name="llama3",
            enabled=True,
            share_customer_tier=True,
            share_loyalty_status=True,
            share_account_age=True,
            share_lifetime_revenue=True,
            share_purchase_count=True,
            share_purchase_frequency=True,
            share_avg_order_value=True,
            share_historical_discounts=True,
            share_active_subscriptions=True,
            share_subscription_type=True,
            share_subscription_value=True,
            share_renewal_info=True,
            share_product_info=True,
            share_pricing=True,
            share_discounts=True,
            share_margins=True,
            share_approval_status=True,
            share_deal_health=True,
            share_deal_stage=True,
            share_negotiation_history=True,
            share_delivery_risk=True,
            share_warehouse_availability=True,
            share_stock_quantities=True,
            share_allocation_plans=True,
            share_backorders=True,
            share_shipping_cost=True,
            share_courier_info=True,
            share_eta=True,
            share_logistics_info=True,
            purpose_quotation_explanation=True,
            purpose_sales_recommendation=True,
            purpose_finance_analysis=True,
            purpose_fulfillment_recommendation=True,
            purpose_deal_health_explanation=True
        )
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
        c4 = Customer(id="c-wayne", name="Wayne Enterprises", email="bruce@wayneent.com", company="Wayne Enterprises", tier_id="tier-gold")
        db.add_all([c1, c2, c3, c4])
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
            Product(id="p-laptop", name="Laptop X Enterprise Edition", sku="HW-LPT-X", category="cat-hw", sales_price=25000.0, cost=18000.0),
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
        w1 = Warehouse(id="w-1", name="Warehouse A (East Coast - NY)", location="New York, NY", pincode="10001")
        w2 = Warehouse(id="w-2", name="Warehouse B (West Coast - SF)", location="San Francisco, CA", pincode="94105")
        w3 = Warehouse(id="w-3", name="Warehouse C (Central Hub - Chicago)", location="Chicago, IL", pincode="60601")
        db.add_all([w1, w2, w3])
        db.commit()

        stocks = [
            # Laptop X stock scenario: A=6, B=7, C=10 (Matches prompt spec requirement!)
            Stock(id="s-laptop-1", product_id="p-laptop", warehouse_id="w-1", quantity_on_hand=6, quantity_allocated=0),
            Stock(id="s-laptop-2", product_id="p-laptop", warehouse_id="w-2", quantity_on_hand=7, quantity_allocated=0),
            Stock(id="s-laptop-3", product_id="p-laptop", warehouse_id="w-3", quantity_on_hand=10, quantity_allocated=0),
            
            # Enterprise Server XL stock
            Stock(id="s-1", product_id="p-1", warehouse_id="w-1", quantity_on_hand=6, quantity_allocated=0),
            Stock(id="s-2", product_id="p-1", warehouse_id="w-2", quantity_on_hand=7, quantity_allocated=0),
            Stock(id="s-3", product_id="p-1", warehouse_id="w-3", quantity_on_hand=10, quantity_allocated=0),
            
            # Cloud Storage & Services
            Stock(id="s-4", product_id="p-2", warehouse_id="w-1", quantity_on_hand=50, quantity_allocated=0),
            Stock(id="s-5", product_id="p-2", warehouse_id="w-2", quantity_on_hand=20, quantity_allocated=0),
            Stock(id="s-6", product_id="p-3", warehouse_id="w-1", quantity_on_hand=100, quantity_allocated=0),
            Stock(id="s-7", product_id="p-4", warehouse_id="w-1", quantity_on_hand=100, quantity_allocated=0),
        ]
        db.add_all(stocks)
        db.commit()

    # 5. Seed Commercial Policies & Approval Rules
    if db.query(DiscountPolicy).count() == 0:
        print("Seeding commercial discount policies & approval rules...")
        dp1 = DiscountPolicy(id="dp-rep", tier_id="tier-bronze", max_discount_pct=10.0)
        dp2 = DiscountPolicy(id="dp-mgr", tier_id="tier-silver", max_discount_pct=20.0)
        dp3 = DiscountPolicy(id="dp-gold", tier_id="tier-gold", max_discount_pct=25.0)
        db.add_all([dp1, dp2, dp3])

        ar1 = ApprovalRule(id="ar-mgr", required_role="manager", min_discount_pct=10.0, max_discount_pct=25.0)
        ar2 = ApprovalRule(id="ar-fin", required_role="finance", min_discount_pct=25.0, max_discount_pct=50.0)
        db.add_all([ar1, ar2])
        db.commit()

    # 6. Seed Deals, Quotations, Approvals & Orders
    if db.query(Deal).count() == 0:
        print("Seeding deals, quotes & approvals...")
        d1 = Deal(id="d-1", customer_id="c-acme", customer_name="Acme Corporation", value=250000.0, status="approval", risk="high")
        d2 = Deal(id="d-2", customer_id="c-globex", customer_name="Globex Inc", value=150000.0, status="review", risk="low")
        d3 = Deal(id="d-3", customer_id="c-soylent", customer_name="Soylent Corp", value=50000.0, status="draft", risk="low")
        d_ops = Deal(id="d-ops", customer_id="c-wayne", customer_name="Wayne Enterprises", value=500000.0, status="won", risk="low")
        db.add_all([d1, d2, d3, d_ops])
        db.commit()

        # Quotation Q-1024 / q-1 (Deep discount requiring Manager + Finance approval)
        q1 = Quotation(
            id="q-1",
            deal_id="d-1",
            status="PENDING_APPROVAL",
            subtotal=250000.0,
            total_discount=62500.0,
            total=187500.0,
            margin_percentage=18.5,
            risk_score="HIGH",
            requires_approval=True
        )
        ql1 = QuoteLine(id="ql-1", quotation_id="q-1", product_id="p-laptop", quantity=10, unit_price=25000.0, discount_percent=25.0)
        app1 = ApprovalRequest(id="a-1", quotation_id="q-1", requester_id="u-sales-1", status="PENDING")
        db.add_all([q1, ql1, app1])

        # Quotation Q-OPS / q-ops (Fulfillment ready)
        q_ops = Quotation(
            id="q-ops",
            deal_id="d-ops",
            status="ACCEPTED",
            subtotal=500000.0,
            total_discount=0.0,
            total=500000.0,
            margin_percentage=40.0,
            risk_score="LOW",
            requires_approval=False
        )
        ql_ops = QuoteLine(id="ql-ops-1", quotation_id="q-ops", product_id="p-1", quantity=12, unit_price=25000.0, discount_percent=0.0)
        order_ops = Order(id="o-ops-1", quotation_id="q-ops", status="pending_fulfillment")
        db.add_all([q_ops, ql_ops, order_ops])
        db.commit()

    # 7. Seed Subscriptions & Invoices
    if db.query(SubscriptionPlan).count() == 0:
        print("Seeding subscription plans & invoices...")
        sp1 = SubscriptionPlan(id="sp-ent", name="Enterprise Cloud Support Plan", billing_cycle="monthly", price=5000.0)
        sp2 = SubscriptionPlan(id="sp-std", name="Standard Cloud Backup Plan", billing_cycle="monthly", price=1500.0)
        db.add_all([sp1, sp2])
        db.commit()

        sub = Subscription(id="sub-1", customer_id="c-acme", plan_id="sp-ent", status="ACTIVE")
        db.add(sub)
        db.commit()

        inv = Invoice(id="inv-1", order_id="o-ops-1", customer_id="c-acme", status="UNPAID", subtotal=187500.0, tax=33750.0, total=221250.0)
        inv_line = InvoiceLine(id="il-1", invoice_id="inv-1", description="Laptop X Enterprise Units (10 Units)", quantity=10, unit_price=25000.0, amount=187500.0)
        db.add_all([inv, inv_line])
        db.commit()

    # 8. Seed Audit Events & Portal Quote Messages
    if db.query(AuditEvent).count() == 0:
        print("Seeding audit events...")
        ae1 = AuditEvent(id="ae-1", user_id="u-sales-1", action="QUOTE_CREATED", entity_type="Quotation", entity_id="q-1", details="Created quotation q-1 with 25% discount and high risk score")
        ae2 = AuditEvent(id="ae-2", user_id="u-sales-1", action="APPROVAL_SUBMITTED", entity_type="ApprovalRequest", entity_id="a-1", details="Submitted q-1 for Sales Manager and Finance approval")
        db.add_all([ae1, ae2])
        db.commit()

    # 9. Seed Price Lists & Items
    if db.query(PriceList).count() == 0:
        print("Seeding price lists...")
        pl1 = PriceList(id="pl-std", name="Standard Enterprise INR Rate Card", currency="INR")
        pl2 = PriceList(id="pl-usd", name="Global USD Rate Card", currency="USD")
        db.add_all([pl1, pl2])
        db.commit()

    if db.query(PriceListItem).count() == 0:
        print("Seeding price list items...")
        prods = db.query(Product).all()
        pl = db.query(PriceList).first()
        pl_id = pl.id if pl else "pl-std"
        p_id1 = prods[0].id if prods else "p-1"
        p_id2 = prods[1].id if len(prods) > 1 else p_id1

        pli1 = PriceListItem(id="pli-1", price_list_id=pl_id, product_id=p_id1, price=25000.0)
        pli2 = PriceListItem(id="pli-2", price_list_id=pl_id, product_id=p_id2, price=15000.0)
        db.add_all([pli1, pli2])
        db.commit()

    # 10. Seed Fulfillment Allocations & Backorders
    if db.query(FulfillmentAllocation).count() == 0:
        print("Seeding fulfillment allocations & backorders...")
        ql = db.query(QuoteLine).first()
        ql_id = ql.id if ql else "ql-ops-1"
        order = db.query(Order).first()
        ord_id = order.id if order else "o-ops-1"
        wh = db.query(Warehouse).first()
        wh_id = wh.id if wh else "w-3"
        
        fa1 = FulfillmentAllocation(id="fa-1", order_id=ord_id, quote_line_id=ql_id, warehouse_id=wh_id, quantity=10)
        db.add(fa1)
        db.commit()

    if db.query(Backorder).count() == 0:
        prods = db.query(Product).all()
        p_id = prods[0].id if prods else "p-1"
        order = db.query(Order).first()
        ord_id = order.id if order else "o-ops-1"
        bo1 = Backorder(id="bo-1", order_id=ord_id, product_id=p_id, quantity=2, status="PENDING")
        db.add(bo1)
        db.commit()

    # 11. Seed Subscription Lines, Billing Schedule Items & Payments
    if db.query(SubscriptionLine).count() == 0:
        print("Seeding subscription lines, billing schedule & payments...")
        sub = db.query(Subscription).first()
        sub_id = sub.id if sub else "sub-1"
        prods = db.query(Product).all()
        p_id = prods[0].id if prods else "p-1"
        
        sl1 = SubscriptionLine(id="sl-1", subscription_id=sub_id, product_id=p_id, quantity=1, unit_price=5000.0, billing_cycle="monthly")
        db.add(sl1)
        db.commit()

    if db.query(BillingScheduleItem).count() == 0:
        from datetime import datetime, timezone
        bsi1 = BillingScheduleItem(id="bsi-1", subscription_id="sub-1", due_date=datetime.now(timezone.utc), amount=5000.0, status="PENDING")
        db.add(bsi1)
        db.commit()

    if db.query(Payment).count() == 0:
        pay1 = Payment(id="pay-1", invoice_id="inv-1", amount=50000.0, method="CREDIT_CARD", status="COMPLETED")
        db.add(pay1)
        db.commit()

    # 12. Seed Portal Quote Messages & Approval Audit Logs
    if db.query(QuoteMessage).count() == 0:
        print("Seeding quote messages & approval audit logs...")
        qm1 = QuoteMessage(id="qm-1", quotation_id="q-1", sender_type="CUSTOMER", content="Can we request an additional 5% margin discount on the Laptop X units?")
        qm2 = QuoteMessage(id="qm-2", quotation_id="q-1", sender_type="INTERNAL", content="Quote q-1 submitted to Sales Manager and Finance VP for high discount override.")
        db.add_all([qm1, qm2])
        db.commit()

    if db.query(ApprovalAuditLog).count() == 0:
        aal1 = ApprovalAuditLog(id="aal-1", approval_request_id="a-1", actor_id="u-sales-1", action="SUBMITTED", reason="High discount requested for strategic Acme Corp renewal.")
        aal2 = ApprovalAuditLog(id="aal-2", approval_request_id="a-1", actor_id="u-mgr-1", action="APPROVED", reason="Manager pre-approved tier discount alignment.")
        db.add_all([aal1, aal2])
        db.commit()

    db.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_db()
