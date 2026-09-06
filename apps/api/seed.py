import sys
import os

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

import uuid
import random
from decimal import Decimal
from datetime import datetime, timedelta, timezone

# Ensure apps/api directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.core.database import SessionLocal, engine, Base
from src.core.security import get_password_hash
from src.models.user import User
from src.models.customer import CustomerTier, Customer
from src.models.product import Product
from src.models.pricing import PriceList, PriceListItem
from src.models.admin import Category, DiscountPolicy, ApprovalRule, PricingRule, SubscriptionPlan, GlobalSetting, ApprovalChain
from src.models.deal import Deal
from src.models.quotation import Quotation, QuoteLine
from src.models.approval import ApprovalRequest, ApprovalAuditLog
from src.models.operations import Warehouse, Stock, Order, FulfillmentAllocation, Backorder
from src.models.billing import Subscription, SubscriptionLine, BillingScheduleItem, Invoice, InvoiceLine, Payment
from src.models.portal import QuoteMessage
from src.models.audit import AuditEvent, AuditLog
from src.models.ai_config import CompanyAIConfig
from src.models.organization import OrganizationProfile

def generate_uuid():
    return str(uuid.uuid4())

def random_date(start_days_ago=365, end_days_ago=0):
    """Generate a random timezone-aware UTC datetime between start_days_ago and end_days_ago."""
    days_offset = random.uniform(end_days_ago, start_days_ago)
    return datetime.now(timezone.utc) - timedelta(days=days_offset)

from sqlalchemy import text

def clean_database(db):
    print("Ensuring database tables match current model metadata...")
    Base.metadata.create_all(bind=engine)
    try:
        db.execute(text("ALTER TABLE customers ADD COLUMN IF NOT EXISTS assigned_sales_rep_id VARCHAR(36) REFERENCES users(id);"))
        db.execute(text("ALTER TABLE deals ADD COLUMN IF NOT EXISTS owner_id VARCHAR(36) REFERENCES users(id);"))
        db.execute(text("ALTER TABLE quote_messages ADD COLUMN IF NOT EXISTS sender_id VARCHAR(36) REFERENCES users(id);"))
        db.execute(text("ALTER TABLE quote_messages ADD COLUMN IF NOT EXISTS status VARCHAR(50);"))
        db.execute(text("ALTER TABLE quote_messages ADD COLUMN IF NOT EXISTS counter_discount_pct FLOAT;"))
        db.execute(text("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS product_id VARCHAR(36) REFERENCES products(id);"))
        db.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(255);"))
        db.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier VARCHAR(255);"))
        db.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery VARCHAR(255);"))
        db.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes VARCHAR(255);"))
        db.execute(text("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50);"))
        db.execute(text("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_paid FLOAT DEFAULT 0.0;"))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"  Note on column migration: {e}")
    print("Clearing existing database records for clean idempotent seed...")
    tables_to_clear = [
        QuoteMessage,
        ApprovalAuditLog,
        ApprovalRequest,
        Payment,
        InvoiceLine,
        Invoice,
        BillingScheduleItem,
        SubscriptionLine,
        Subscription,
        Backorder,
        FulfillmentAllocation,
        Order,
        QuoteLine,
        Quotation,
        Deal,
        Customer,
        CustomerTier,
        Stock,
        Warehouse,
        PriceListItem,
        PriceList,
        Product,
        Category,
        ApprovalChain,
        ApprovalRule,
        DiscountPolicy,
        PricingRule,
        SubscriptionPlan,
        GlobalSetting,
        CompanyAIConfig,
        OrganizationProfile,
        AuditLog,
        AuditEvent,
        User,
    ]
    for model in tables_to_clear:
        try:
            db.query(model).delete()
        except Exception as e:
            db.rollback()
            print(f"  Note: error clearing table for {model.__name__}: {e}")
    db.commit()
    print("  Database reset complete.")

def seed_db():
    print("==========================================")
    print("Starting Comprehensive High-Volume Seeder")
    print("==========================================")
    
    db = SessionLocal()

    try:
        # Reset database tables
        clean_database(db)

        # ---------------------------------------------------------
        # 1. Organization & AI Config
        # ---------------------------------------------------------
        print("1. Seeding Organization Profile & AI Config...")
        org = OrganizationProfile(
            id="org-default",
            company_name="DealFlow360 Enterprises",
            legal_name="DealFlow360 Technologies Private Limited",
            industry="Software & Enterprise IT Services",
            business_type="B2B Enterprise SaaS & Hardware",
            headquarters="San Francisco, CA & Mumbai, MH",
            operating_regions="North America, Europe, Asia Pacific",
            countries_served="United States, Canada, United Kingdom, India, Singapore",
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

        ai_cfg = CompanyAIConfig(
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
        db.add(ai_cfg)

        # Global Settings
        global_settings = [
            GlobalSetting(key="min_margin_threshold", value="15.0", description="Minimum gross margin required without executive approval"),
            GlobalSetting(key="max_discount_sales_rep", value="10.0", description="Maximum discount percent allowed for Sales Reps"),
            GlobalSetting(key="max_discount_sales_mgr", value="25.0", description="Maximum discount percent allowed for Sales Managers"),
            GlobalSetting(key="auto_order_creation", value="true", description="Automatically create order when quotation is accepted"),
            GlobalSetting(key="currency_symbol", value="₹", description="Default primary currency symbol"),
        ]
        db.add_all(global_settings)
        db.commit()

        # ---------------------------------------------------------
        # 2. Users (RBAC: Admin, Managers, Finance, Sales Reps, Customers)
        # ---------------------------------------------------------
        print("2. Seeding Users across all RBAC roles...")
        admin_user = User(
            id="u-admin-1",
            name="System Admin",
            email="admin@dealflow360.com",
            password_hash=get_password_hash("admin123"),
            role="admin",
            is_active=True
        )
        db.add(admin_user)

        managers = [
            User(id="u-mgr-1", name="Michael Scott", email="manager1@dealflow360.com", password_hash=get_password_hash("manager123"), role="sales_manager", is_active=True),
            User(id="u-mgr-2", name="Priya Sharma", email="manager2@dealflow360.com", password_hash=get_password_hash("manager123"), role="sales_manager", is_active=True),
        ]
        db.add_all(managers)

        finance_users = [
            User(id="u-fin-1", name="Fiona Gallagher", email="finance1@dealflow360.com", password_hash=get_password_hash("finance123"), role="finance", is_active=True),
            User(id="u-fin-2", name="Rajesh Kumar", email="finance2@dealflow360.com", password_hash=get_password_hash("finance123"), role="finance", is_active=True),
        ]
        db.add_all(finance_users)

        sales_reps = [
            User(id="u-sales-1", name="Sarah Rep", email="sales1@dealflow360.com", password_hash=get_password_hash("sales123"), role="sales_rep", is_active=True),
            User(id="u-sales-2", name="Aryan Kumar", email="sales2@dealflow360.com", password_hash=get_password_hash("sales123"), role="sales_rep", is_active=True),
            User(id="u-sales-3", name="Jessica Chen", email="sales3@dealflow360.com", password_hash=get_password_hash("sales123"), role="sales_rep", is_active=True),
            User(id="u-sales-4", name="David Miller", email="sales4@dealflow360.com", password_hash=get_password_hash("sales123"), role="sales_rep", is_active=True),
            User(id="u-sales-5", name="Ananya Verma", email="sales5@dealflow360.com", password_hash=get_password_hash("sales123"), role="sales_rep", is_active=True),
        ]
        db.add_all(sales_reps)
        db.commit()

        # ---------------------------------------------------------
        # 3. Customer Tiers & B2B Customers
        # ---------------------------------------------------------
        print("3. Seeding Customer Tiers & 40 B2B Customers...")
        tier_bronze = CustomerTier(id="tier-bronze", name="Bronze", min_spend=0.0, max_discount_pct=10.0)
        tier_silver = CustomerTier(id="tier-silver", name="Silver", min_spend=50000.0, max_discount_pct=15.0)
        tier_gold = CustomerTier(id="tier-gold", name="Gold", min_spend=150000.0, max_discount_pct=25.0)
        db.add_all([tier_bronze, tier_silver, tier_gold])
        db.commit()

        customer_companies = [
            ("Acme Corporation", "customer1@acme.com", "tier-gold"),
            ("Globex Inc", "customer2@globex.com", "tier-silver"),
            ("Soylent Corp", "customer3@soylent.com", "tier-bronze"),
            ("Wayne Enterprises", "customer4@wayne.com", "tier-gold"),
            ("Stark Industries", "customer5@stark.com", "tier-gold"),
            ("Cyberdyne Systems", "contact@cyberdyne.com", "tier-silver"),
            ("Initech Solutions", "info@initech.com", "tier-bronze"),
            ("Umbrella Corp", "purchasing@umbrella.com", "tier-silver"),
            ("Hooli Enterprise", "tech@hooli.com", "tier-gold"),
            ("Pied Piper Cloud", "richard@piedpiper.com", "tier-silver"),
            ("Massive Dynamic", "admin@massivedynamic.com", "tier-gold"),
            ("Oscorp Technologies", "norman@oscorp.com", "tier-gold"),
            ("LexCorp International", "lex@lexcorp.com", "tier-gold"),
            ("Tyrell BioTech", "eldon@tyrell.com", "tier-silver"),
            ("Weyland-Yutani Corp", "contact@weyland.com", "tier-gold"),
            ("Virtucon Global", "dr@virtucon.com", "tier-silver"),
            ("Dunder Mifflin Paper", "dwight@dundermifflin.com", "tier-bronze"),
            ("Sterling Cooper Ad", "don@sterlingcooper.com", "tier-bronze"),
            ("Wonka Industries", "willy@wonka.com", "tier-silver"),
            ("Oceanic Airlines Tech", "ops@oceanic.com", "tier-bronze"),
            ("Gringotts Financial", "bank@gringotts.com", "tier-gold"),
            ("Aperture Science Labs", "cave@aperture.com", "tier-silver"),
            ("Black Mesa Research", "gordon@blackmesa.com", "tier-silver"),
            ("Abstergo Enterprise", "corporate@abstergo.com", "tier-silver"),
            ("Omni Consumer Products", "ocp@omni.com", "tier-gold"),
            ("Ingen Biotech", "hammond@ingen.com", "tier-silver"),
            ("E Corp Network", "elliot@ecorp.com", "tier-gold"),
            ("Initrode Software", "contact@initrode.com", "tier-bronze"),
            ("Vandelay Imports", "george@vandelay.com", "tier-bronze"),
            ("Archer Tactical", "sterling@archer.com", "tier-bronze"),
            ("Bluth Development", "gob@bluth.com", "tier-bronze"),
            ("Rekall Memory Systems", "doug@rekall.com", "tier-silver"),
            ("Cyber Research Systems", "crs@cyber.com", "tier-silver"),
            ("Sovereign Tech", "contact@sovereign.com", "tier-bronze"),
            ("Nova Robotics", "info@novarobotics.com", "tier-silver"),
            ("Spectra Corp", "spectre@spectra.com", "tier-silver"),
            ("Wayne Tech India", "mumbai@waynetech.com", "tier-gold"),
            ("Stark Tech Bangalore", "blr@starktech.com", "tier-gold"),
            ("Pied Piper India", "delhi@piedpiper.com", "tier-silver"),
            ("Hooli Systems Pune", "pune@hooli.com", "tier-gold")
        ]

        customers = []
        customer_users = []
        for idx, (company, email, tier_id) in enumerate(customer_companies):
            assigned_rep = sales_reps[idx % len(sales_reps)]
            cust_id = f"c-{idx+1:03d}"
            c = Customer(
                id=cust_id,
                name=f"Contact for {company}",
                email=email,
                company=company,
                tier_id=tier_id,
                assigned_sales_rep_id=assigned_rep.id,
                created_at=random_date(365, 30)
            )
            customers.append(c)

            # Create customer user login
            u_cust = User(
                id=f"u-cust-{idx+1:03d}",
                name=f"User {company}",
                email=email,
                password_hash=get_password_hash("customer123"),
                role="customer",
                is_active=True,
                created_at=c.created_at
            )
            customer_users.append(u_cust)

        db.add_all(customers)
        db.add_all(customer_users)
        db.commit()

        # ---------------------------------------------------------
        # 4. Categories & 80 Products
        # ---------------------------------------------------------
        print("4. Seeding 12 Categories & 80 Products...")
        categories_data = [
            ("cat-laptops", "Laptops & Workstations", "Enterprise grade portable workstations and laptops"),
            ("cat-servers", "Enterprise Servers", "Rackmount, blade, and tower servers for datacenter"),
            ("cat-networking", "Networking & Telephony", "Switches, routers, firewalls, and access points"),
            ("cat-displays", "Displays & Peripherals", "4K monitors, docking stations, and ergonomic gear"),
            ("cat-cloud", "Cloud Storage & Infra", "High availability cloud backup, SAN, and NVMe arrays"),
            ("cat-security", "Security & Compliance", "Endpoint security, zero-trust gateways, and firewalls"),
            ("cat-saas", "SaaS Subscriptions", "Recurring cloud software licenses and enterprise SaaS"),
            ("cat-analytics", "AI & Data Analytics", "Machine learning acceleration and business intelligence"),
            ("cat-services", "Professional Services", "System integration, architecture design, and deployment"),
            ("cat-managed", "Managed IT Services", "24/7 infrastructure management and SOC support"),
            ("cat-support", "Premium Support Contracts", "SLAs, hardware replacement, and dedicated engineers"),
            ("cat-maintenance", "Maintenance & Repair", "Preventative hardware maintenance and spare parts")
        ]

        categories = []
        for cid, name, desc in categories_data:
            cat = Category(id=cid, name=name, description=desc, is_active=True)
            categories.append(cat)
        db.add_all(categories)
        db.commit()

        # Generate 80 realistic products across categories
        products = []
        # Flagship Laptop X Enterprise Edition for test scenarios
        products.append(Product(id="p-laptop", name="Laptop X Enterprise Edition", sku="HW-LPT-X", category="cat-laptops", sales_price=25000.0, cost=18000.0, active=True))
        products.append(Product(id="p-1", name="Enterprise Server XL", sku="HW-SRV-XL", category="cat-servers", sales_price=15000.0, cost=10000.0, active=True))
        products.append(Product(id="p-2", name="Cloud Storage 10TB (Monthly)", sku="SW-CLD-10", category="cat-cloud", sales_price=5000.0, cost=1000.0, active=True))
        products.append(Product(id="p-3", name="Implementation Service", sku="SV-IMP-01", category="cat-services", sales_price=2000.0, cost=1500.0, active=True))
        products.append(Product(id="p-4", name="Premium Support (1Y)", sku="SV-SUP-01", category="cat-support", sales_price=1200.0, cost=800.0, active=True))

        product_templates = [
            ("Ultrabook Pro 14", "HW-LPT-14", "cat-laptops", 120000.0, 90000.0),
            ("DevStation Studio 16", "HW-LPT-16", "cat-laptops", 180000.0, 135000.0),
            ("Rugged Book Field Edition", "HW-LPT-RGB", "cat-laptops", 210000.0, 150000.0),
            ("Executive Thin Light 13", "HW-LPT-13", "cat-laptops", 140000.0, 105000.0),

            ("Rack Server 1U Dual-Xeon", "HW-SRV-1U", "cat-servers", 350000.0, 260000.0),
            ("High-Density 2U Storage Server", "HW-SRV-2U", "cat-servers", 550000.0, 400000.0),
            ("Blade Enclosure Chassis", "HW-SRV-BLD", "cat-servers", 1200000.0, 900000.0),
            ("AI GPU Server Node 4xH100", "HW-SRV-GPU", "cat-servers", 2500000.0, 1900000.0),

            ("Core Switch 48-Port 10GbE", "HW-NET-48P", "cat-networking", 180000.0, 110000.0),
            ("Next-Gen Firewall Appliance", "HW-NET-FW", "cat-security", 240000.0, 140000.0),
            ("WiFi 6E Indoor Access Point", "HW-NET-AP6", "cat-networking", 35000.0, 20000.0),
            ("SD-WAN Branch Gateway", "HW-NET-SDW", "cat-networking", 85000.0, 50000.0),
            ("Fiber SAN Switch 32G", "HW-NET-SAN", "cat-networking", 420000.0, 270000.0),

            ("UltraSharp 32-inch 4K Monitor", "HW-DSP-32", "cat-displays", 65000.0, 42000.0),
            ("Dual Thunderbolt 4 Dock", "HW-DSP-DCK", "cat-displays", 22000.0, 13000.0),
            ("Curved 38-inch Ultrawide", "HW-DSP-38", "cat-displays", 95000.0, 62000.0),
            ("Conference Bar 4K AI Cam", "HW-DSP-CAM", "cat-displays", 110000.0, 70000.0),

            ("All-Flash NVMe Array 50TB", "HW-CLD-NVME", "cat-cloud", 1500000.0, 1000000.0),
            ("Hybrid Cloud Backup Appliance", "HW-CLD-BCK", "cat-cloud", 380000.0, 250000.0),
            ("Object Storage Gateway", "HW-CLD-OBJ", "cat-cloud", 290000.0, 180000.0),

            ("Zero-Trust Endpoint License 100u", "SW-SEC-ZT", "cat-security", 150000.0, 30000.0),
            ("SIEM Log Analytics Annual", "SW-SEC-SIEM", "cat-security", 450000.0, 90000.0),
            ("Vulnerability Scanner Suite", "SW-SEC-VULN", "cat-security", 280000.0, 50000.0),

            ("ERP Cloud Suite (Per User/Mo)", "SW-SAAS-ERP", "cat-saas", 4500.0, 600.0),
            ("CRM Platinum License (Per User/Mo)", "SW-SAAS-CRM", "cat-saas", 3800.0, 500.0),
            ("DevOps Automation Cloud (Monthly)", "SW-SAAS-DEV", "cat-saas", 25000.0, 3000.0),
            ("AI Business Intelligence Engine", "SW-ANL-AI", "cat-analytics", 120000.0, 18000.0),
            ("Predictive Forecasting Module", "SW-ANL-FCST", "cat-analytics", 85000.0, 12000.0),

            ("Cloud Migration Assessment", "SV-SRV-MIG", "cat-services", 180000.0, 80000.0),
            ("Datacenter Architecture Design", "SV-SRV-ARCH", "cat-services", 250000.0, 100000.0),
            ("24/7 Managed SOC Support (1Y)", "SV-MNG-SOC", "cat-managed", 600000.0, 200000.0),
            ("Dedicated TAM Engineer (1Y)", "SV-SUP-TAM", "cat-support", 850000.0, 400000.0),
            ("Onsite Hardware SLA 4-Hour", "SV-SUP-4HR", "cat-support", 150000.0, 60000.0),
            ("Annual Hardware Preventive Maintenance", "SV-MNT-ANN", "cat-maintenance", 95000.0, 35000.0),
        ]

        for idx, (name, sku, cat, price, cost) in enumerate(product_templates):
            pid = f"p-cat-{idx+5:03d}"
            p = Product(id=pid, name=name, sku=sku, category=cat, sales_price=price, cost=cost, active=True)
            products.append(p)

        # Generate additional items to reach 80 products total
        for i in range(len(products), 80):
            pid = f"p-gen-{i+1:03d}"
            cat_id = categories[i % len(categories)].id
            margin_factor = random.choice([0.85, 0.70, 0.50, 0.20]) # hardware low margin, software high margin
            sp = round(random.uniform(5000, 500000), -2)
            cp = round(sp * margin_factor, -2)
            p = Product(
                id=pid,
                name=f"Enterprise Solutions Item #{i+1}",
                sku=f"SKU-GEN-{i+1:04d}",
                category=cat_id,
                sales_price=sp,
                cost=cp,
                active=True
            )
            products.append(p)

        db.add_all(products)
        db.commit()

        # ---------------------------------------------------------
        # 5. Price Lists & Price List Items
        # ---------------------------------------------------------
        print("5. Seeding 4 Price Lists & Items...")
        price_lists = [
            PriceList(id="pl-std", name="Standard Enterprise INR Rate Card", currency="INR"),
            PriceList(id="pl-usd", name="Global USD Rate Card", currency="USD"),
            PriceList(id="pl-part", name="Preferred Partner Rate Card", currency="INR"),
            PriceList(id="pl-gov", name="Government & Public Sector Rate Card", currency="INR"),
        ]
        db.add_all(price_lists)
        db.commit()

        price_items = []
        for p in products:
            price_items.append(PriceListItem(id=f"pli-std-{p.id}", price_list_id="pl-std", product_id=p.id, price=p.sales_price))
            price_items.append(PriceListItem(id=f"pli-usd-{p.id}", price_list_id="pl-usd", product_id=p.id, price=round(p.sales_price / 83.0, 2)))
            price_items.append(PriceListItem(id=f"pli-part-{p.id}", price_list_id="pl-part", product_id=p.id, price=round(p.sales_price * 0.90, 2)))
            price_items.append(PriceListItem(id=f"pli-gov-{p.id}", price_list_id="pl-gov", product_id=p.id, price=round(p.sales_price * 0.88, 2)))
        db.add_all(price_items)
        db.commit()

        # ---------------------------------------------------------
        # 6. Pricing Rules, Discount Policies & Approval Rules/Chains
        # ---------------------------------------------------------
        print("6. Seeding Pricing Rules, Discount Policies & Approval Rules...")
        discount_policies = [
            DiscountPolicy(id="dp-bronze", name="Bronze Standard Discount", target_tier="tier-bronze", target_category=None, max_discount_percent=Decimal("10.00"), min_margin_percent=Decimal("15.00"), is_active=True),
            DiscountPolicy(id="dp-silver", name="Silver Tier Preferred Discount", target_tier="tier-silver", target_category=None, max_discount_percent=Decimal("15.00"), min_margin_percent=Decimal("15.00"), is_active=True),
            DiscountPolicy(id="dp-gold", name="Gold Tier Strategic Discount", target_tier="tier-gold", target_category=None, max_discount_percent=Decimal("25.00"), min_margin_percent=Decimal("12.00"), is_active=True),
            DiscountPolicy(id="dp-hw-cap", name="Hardware Margin Guardrail", target_tier=None, target_category="cat-laptops", max_discount_percent=Decimal("12.00"), min_margin_percent=Decimal("15.00"), is_active=True),
            DiscountPolicy(id="dp-saas-flex", name="SaaS Volume Expansion Policy", target_tier=None, target_category="cat-saas", max_discount_percent=Decimal("35.00"), min_margin_percent=Decimal("50.00"), is_active=True),
        ]
        db.add_all(discount_policies)

        pricing_rules = [
            PricingRule(id="pr-rep", name="Sales Rep Max Discount Rule", target_role="sales_rep", max_discount_percent=Decimal("10.00"), requires_approval_above=Decimal("10.00"), is_active=True),
            PricingRule(id="pr-mgr", name="Sales Manager Approval Authority", target_role="sales_manager", max_discount_percent=Decimal("25.00"), requires_approval_above=Decimal("25.00"), is_active=True),
            PricingRule(id="pr-fin", name="Finance Executive Approval Authority", target_role="finance", max_discount_percent=Decimal("50.00"), requires_approval_above=Decimal("50.00"), is_active=True),
        ]
        db.add_all(pricing_rules)

        approval_rules = [
            ApprovalRule(id="ar-mgr-disc", name="Manager Approval on >10% Discount", risk_threshold="low", discount_threshold=Decimal("10.00"), target_role="sales_manager", is_active=True),
            ApprovalRule(id="ar-fin-disc", name="Finance Approval on >25% Discount", risk_threshold="medium", discount_threshold=Decimal("25.00"), target_role="finance", is_active=True),
            ApprovalRule(id="ar-fin-high-risk", name="Finance Override on High Risk", risk_threshold="high", discount_threshold=Decimal("15.00"), target_role="finance", is_active=True),
        ]
        db.add_all(approval_rules)

        approval_chains = [
            ApprovalChain(id="ac-std", name="Standard Manager -> Finance Chain", sequence="sales_manager,finance", is_active=True),
            ApprovalChain(id="ac-exec", name="Executive Escalation Chain", sequence="sales_manager,finance,admin", is_active=True),
        ]
        db.add_all(approval_chains)
        db.commit()

        # ---------------------------------------------------------
        # 7. Warehouses & Product Stock
        # ---------------------------------------------------------
        print("7. Seeding 7 Warehouses & 350+ Stock Records...")
        warehouses_data = [
            ("w-1", "WH-AMH", "Ahmedabad Regional Hub", "Ahmedabad, MH", "380001", "GIDC Electronics Zone", "Ahmedabad", "Gujarat", "India", 15000),
            ("w-2", "WH-MUM", "Mumbai Central Logistics", "Mumbai, MH", "400001", "Bandra Kurla Complex", "Mumbai", "Maharashtra", "India", 25000),
            ("w-3", "WH-DEL", "Delhi NCR Distribution Center", "Delhi, DL", "110001", "Okhla Industrial Area", "New Delhi", "Delhi", "India", 20000),
            ("w-4", "WH-BLR", "Bangalore Tech Depot", "Bangalore, KA", "560001", "Whitefield IT Park", "Bangalore", "Karnataka", "India", 18000),
            ("w-5", "WH-PNE", "Pune Industrial Warehouse", "Pune, MH", "411001", "Chakan MIDC", "Pune", "Maharashtra", "India", 12000),
            ("w-6", "WH-HYD", "Hyderabad Express Facility", "Hyderabad, TS", "500001", "HITEC City", "Hyderabad", "Telangana", "India", 14000),
            ("w-7", "WH-MAA", "Chennai Port Terminal", "Chennai, TN", "600001", "Sriperumbudur Hub", "Chennai", "Tamil Nadu", "India", 16000),
        ]

        warehouses = []
        for wid, code, name, loc, pin, addr, city, state, country, cap in warehouses_data:
            w = Warehouse(id=wid, code=code, name=name, location=loc, pincode=pin, address=addr, city=city, state=state, country=country, capacity=cap, is_active=True)
            warehouses.append(w)
        db.add_all(warehouses)
        db.commit()

        stocks = []
        # Explicit required scenario: Laptop X Enterprise: WH-1=6, WH-2=7, WH-3=10
        stocks.append(Stock(id="s-laptop-w1", product_id="p-laptop", warehouse_id="w-1", quantity_on_hand=6, quantity_allocated=0))
        stocks.append(Stock(id="s-laptop-w2", product_id="p-laptop", warehouse_id="w-2", quantity_on_hand=7, quantity_allocated=0))
        stocks.append(Stock(id="s-laptop-w3", product_id="p-laptop", warehouse_id="w-3", quantity_on_hand=10, quantity_allocated=0))

        # Seed stock for all products across all warehouses
        for p in products:
            for w in warehouses:
                # Avoid overwriting Laptop X explicitly seeded above
                if p.id == "p-laptop" and w.id in ["w-1", "w-2", "w-3"]:
                    continue
                
                # Stock distribution types: abundant, low, zero, shortage
                rnd = random.random()
                if rnd < 0.15:
                    q_on_hand = 0 # Zero stock
                elif rnd < 0.30:
                    q_on_hand = random.randint(1, 5) # Low stock
                elif rnd < 0.85:
                    q_on_hand = random.randint(15, 100) # Abundant stock
                else:
                    q_on_hand = random.randint(100, 300) # High stock

                stk = Stock(
                    id=f"stk-{p.id}-{w.id}",
                    product_id=p.id,
                    warehouse_id=w.id,
                    quantity_on_hand=q_on_hand,
                    quantity_allocated=0
                )
                stocks.append(stk)

        db.add_all(stocks)
        db.commit()

        # ---------------------------------------------------------
        # 8. Subscription Plans
        # ---------------------------------------------------------
        print("8. Seeding Subscription Plans...")
        subscription_plans = [
            SubscriptionPlan(id="sp-ent", name="Enterprise Cloud Support Plan", description="Dedicated 24/7 SLA support & backup", interval="month", price=Decimal("5000.00"), is_active=True),
            SubscriptionPlan(id="sp-std", name="Standard Cloud Backup Plan", description="Automated daily cloud backups 10TB", interval="month", price=Decimal("1500.00"), is_active=True),
            SubscriptionPlan(id="sp-annual", name="Annual Infrastructure Assurance", description="Yearly preventive hardware maintenance", interval="year", price=Decimal("45000.00"), is_active=True),
        ]
        db.add_all(subscription_plans)
        db.commit()

        # ---------------------------------------------------------
        # 9. Deals, Quotations & Quotation Lines (80 Deals, 120 Quotes, 300+ Lines)
        # EVERY Deal MUST have at least 1 Quotation!
        # ---------------------------------------------------------
        print("9. Seeding 80 Deals & 120+ Quotations with Lines...")
        
        deal_statuses = [
            ("New", 10),
            ("Qualified", 10),
            ("Quotation", 15),
            ("Approval", 15),
            ("Negotiation", 10),
            ("Won", 15),
            ("Lost", 5)
        ]

        # Flatten status list
        flat_statuses = []
        for status_name, count in deal_statuses:
            flat_statuses.extend([status_name] * count)
        random.shuffle(flat_statuses)

        deals = []
        quotations = []
        quote_lines = []
        approval_requests = []
        approval_logs = []
        quote_messages = []

        deal_counter = 1
        quote_counter = 1
        line_counter = 1
        app_counter = 1

        for idx in range(80):
            cust = customers[idx % len(customers)]
            sales_rep = next((u for u in sales_reps if u.id == cust.assigned_sales_rep_id), sales_reps[0])
            deal_status = flat_statuses[idx]
            created_dt = random_date(365, 5)

            deal_id = f"d-{deal_counter:03d}"
            deal_counter += 1

            # Estimate deal value based on products to be added
            d = Deal(
                id=deal_id,
                customer_id=cust.id,
                customer_name=cust.company,
                value=Decimal("0.00"),
                status=deal_status,
                risk="low" if deal_status in ["Won", "Qualified"] else ("high" if deal_status == "Approval" else "medium"),
                owner_id=sales_rep.id,
                created_at=created_dt
            )
            deals.append(d)

            # Every deal gets 1 primary quotation, some get 2 (version history)
            num_quotes = 2 if idx % 4 == 0 else 1
            deal_total_val = 0.0

            for q_idx in range(num_quotes):
                quote_id = f"q-{quote_counter:03d}"
                quote_counter += 1

                # Map deal status to quotation status
                if deal_status == "Won":
                    q_status = "ACCEPTED"
                elif deal_status == "Lost":
                    q_status = "REJECTED"
                elif deal_status == "Approval":
                    q_status = "PENDING_APPROVAL"
                elif deal_status == "Negotiation":
                    q_status = "NEGOTIATION"
                elif deal_status == "Quotation":
                    q_status = "SENT"
                else:
                    q_status = "draft" if q_idx == 0 else "SENT"

                # Pick 2-5 products for lines
                selected_prods = random.sample(products, random.randint(2, 5))
                subtotal = 0.0
                total_disc = 0.0
                total = 0.0
                total_cost = 0.0

                current_lines = []
                for p in selected_prods:
                    qty = random.randint(1, 10)
                    u_price = p.sales_price
                    # Set discount according to scenario
                    if q_status == "PENDING_APPROVAL":
                        disc_pct = float(random.choice([15.0, 25.0, 35.0])) # High discount triggers approval
                    elif cust.tier_id == "tier-gold":
                        disc_pct = float(random.choice([5.0, 10.0, 15.0, 20.0]))
                    else:
                        disc_pct = float(random.choice([0.0, 5.0, 10.0]))

                    l_sub = qty * u_price
                    l_disc = l_sub * (disc_pct / 100.0)
                    l_tot = l_sub - l_disc
                    l_cost = qty * p.cost

                    subtotal += l_sub
                    total_disc += l_disc
                    total += l_tot
                    total_cost += l_cost

                    ql = QuoteLine(
                        id=f"ql-{line_counter:04d}",
                        quotation_id=quote_id,
                        product_id=p.id,
                        quantity=qty,
                        unit_price=u_price,
                        discount_percent=disc_pct,
                        created_at=created_dt
                    )
                    line_counter += 1
                    current_lines.append(ql)
                    quote_lines.append(ql)

                margin_pct = float(((total - total_cost) / total * 100.0)) if total > 0 else 0.0
                risk = "HIGH" if (q_status == "PENDING_APPROVAL" or margin_pct < 15.0 or (total_disc / subtotal) > 0.20) else ("MEDIUM" if margin_pct < 25.0 else "LOW")
                requires_app = (risk == "HIGH" or q_status == "PENDING_APPROVAL")

                q = Quotation(
                    id=quote_id,
                    deal_id=deal_id,
                    status=q_status,
                    subtotal=round(subtotal, 2),
                    total_discount=round(total_disc, 2),
                    total=round(total, 2),
                    margin_percentage=round(margin_pct, 2),
                    risk_score=risk,
                    requires_approval=requires_app,
                    created_at=created_dt + timedelta(hours=q_idx*6)
                )
                quotations.append(q)
                deal_total_val = max(deal_total_val, total)

                # Create Approval Request if status is PENDING_APPROVAL or requires_approval
                if q_status == "PENDING_APPROVAL" or (deal_status == "Approval" and q_idx == num_quotes - 1):
                    app_id = f"app-{app_counter:03d}"
                    app_counter += 1
                    app_req = ApprovalRequest(
                        id=app_id,
                        quotation_id=quote_id,
                        requester_id=sales_rep.id,
                        status="PENDING",
                        created_at=q.created_at + timedelta(minutes=30)
                    )
                    approval_requests.append(app_req)

                    # Add audit log
                    approval_logs.append(ApprovalAuditLog(
                        id=f"aal-sub-{app_id}",
                        approval_request_id=app_id,
                        actor_id=sales_rep.id,
                        action="SUBMITTED",
                        reason=f"Submitted quotation {quote_id} with {round((total_disc/subtotal)*100, 1)}% discount for manager/finance review.",
                        created_at=app_req.created_at
                    ))

                # Create Negotiation Session / Messages if status is NEGOTIATION
                if q_status == "NEGOTIATION":
                    qm1 = QuoteMessage(
                        id=f"qm-{quote_id}-1",
                        quotation_id=quote_id,
                        sender_id=None,
                        sender_type="CUSTOMER",
                        content=f"Hello {sales_rep.name}, we would like to negotiate an additional 5% discount on line items for {cust.company}.",
                        status="PENDING_REP_RESPONSE",
                        counter_discount_pct=15.0,
                        created_at=created_dt + timedelta(days=1)
                    )
                    qm2 = QuoteMessage(
                        id=f"qm-{quote_id}-2",
                        quotation_id=quote_id,
                        sender_id=sales_rep.id,
                        sender_type="SALES_REP",
                        content=f"Hi {cust.company}, I have submitted your counter-offer request to management for approval.",
                        status="ACCEPTED",
                        counter_discount_pct=15.0,
                        created_at=created_dt + timedelta(days=1, hours=4)
                    )
                    quote_messages.extend([qm1, qm2])

            d.value = Decimal(str(round(deal_total_val, 2)))

        db.add_all(deals)
        db.add_all(quotations)
        db.add_all(quote_lines)
        db.add_all(approval_requests)
        db.add_all(approval_logs)
        db.add_all(quote_messages)
        db.commit()

        # ---------------------------------------------------------
        # 10. Orders, Fulfillment Allocations & Backorders (55 Orders, 110+ Allocations)
        # ---------------------------------------------------------
        print("10. Seeding 55 Orders, Fulfillment Allocations & Backorders...")
        won_quotes = [q for q in quotations if q.status == "ACCEPTED"]
        # Add additional quotes to get 55 orders
        other_quotes = [q for q in quotations if q.status in ["SENT", "APPROVED"] and q not in won_quotes]
        eligible_order_quotes = won_quotes + other_quotes[:max(0, 55 - len(won_quotes))]

        orders = []
        allocations = []
        backorders = []
        order_counter = 1
        alloc_counter = 1
        bo_counter = 1

        order_statuses = ["pending_fulfillment", "processing", "partially_shipped", "shipped", "delivered", "fulfilled"]
        carriers = ["FedEx Express", "DHL Supply Chain", "BlueDart Logistics", "Delhivery Surface", "DTDC Priority"]

        for q in eligible_order_quotes[:55]:
            ord_id = f"o-{order_counter:03d}"
            order_counter += 1

            o_status = random.choice(order_statuses)
            carrier = random.choice(carriers)
            track_num = f"TRK-{random.randint(10000000, 99999999)}"
            est_deliv = (q.created_at + timedelta(days=random.randint(3, 7))).strftime("%Y-%m-%d")

            order = Order(
                id=ord_id,
                quotation_id=q.id,
                status=o_status,
                tracking_number=track_num,
                carrier=carrier,
                estimated_delivery=est_deliv,
                delivery_notes=f"Ship to customer facility. Contact customer before delivery.",
                created_at=q.created_at + timedelta(hours=2)
            )
            orders.append(order)

            # Get quote lines for this quotation
            q_lines = [l for l in quote_lines if l.quotation_id == q.id]
            for line in q_lines:
                req_qty = line.quantity
                # Allocate stock from warehouses
                avail_stocks = [s for s in stocks if s.product_id == line.product_id and s.quantity_on_hand > s.quantity_allocated]
                
                remaining_qty = req_qty
                if avail_stocks:
                    for s in avail_stocks:
                        if remaining_qty <= 0:
                            break
                        alloc_qty = min(remaining_qty, s.quantity_on_hand - s.quantity_allocated)
                        if alloc_qty > 0:
                            s.quantity_allocated += alloc_qty
                            remaining_qty -= alloc_qty
                            alloc = FulfillmentAllocation(
                                id=f"fa-{alloc_counter:04d}",
                                order_id=ord_id,
                                quote_line_id=line.id,
                                warehouse_id=s.warehouse_id,
                                quantity=alloc_qty
                            )
                            alloc_counter += 1
                            allocations.append(alloc)

                # If stock was insufficient across all warehouses, create Backorder
                if remaining_qty > 0:
                    bo = Backorder(
                        id=f"bo-{bo_counter:03d}",
                        order_id=ord_id,
                        product_id=line.product_id,
                        quantity=remaining_qty,
                        status="PENDING",
                        created_at=order.created_at
                    )
                    bo_counter += 1
                    backorders.append(bo)

                    # Also add a unallocated fulfillment allocation entry to record backorder line
                    alloc_bo = FulfillmentAllocation(
                        id=f"fa-{alloc_counter:04d}",
                        order_id=ord_id,
                        quote_line_id=line.id,
                        warehouse_id=None,
                        quantity=remaining_qty
                    )
                    alloc_counter += 1
                    allocations.append(alloc_bo)

        db.add_all(orders)
        db.add_all(allocations)
        db.add_all(backorders)
        db.commit()

        # ---------------------------------------------------------
        # 11. Subscriptions, Lines & Billing Schedules (35 Subscriptions)
        # ---------------------------------------------------------
        print("11. Seeding 35 Subscriptions & Billing Schedules...")
        subscriptions = []
        subscription_lines = []
        billing_items = []
        sub_counter = 1

        sub_statuses = ["ACTIVE", "ACTIVE", "TRIAL", "PAUSED", "CANCELLED"]

        for idx in range(35):
            cust = customers[idx % len(customers)]
            plan = subscription_plans[idx % len(subscription_plans)]
            ord_item = orders[idx % len(orders)] if orders else None

            sub_id = f"sub-{sub_counter:03d}"
            sub_counter += 1
            st = sub_statuses[idx % len(sub_statuses)]
            st_date = random_date(180, 10)

            sub = Subscription(
                id=sub_id,
                order_id=ord_item.id if ord_item else None,
                customer_id=cust.id,
                plan_id=plan.id,
                product_id="p-2", # Cloud Storage 10TB
                status=st,
                interval="monthly" if idx % 2 == 0 else "yearly",
                quantity=random.randint(1, 5),
                price_per_period=float(plan.price),
                start_date=st_date,
                current_period_start=st_date,
                current_period_end=st_date + timedelta(days=30),
                canceled_at=st_date + timedelta(days=60) if st == "CANCELLED" else None,
                created_at=st_date
            )
            subscriptions.append(sub)

            # Subscription Line
            sl = SubscriptionLine(
                id=f"sl-{sub_id}",
                subscription_id=sub_id,
                product_id="p-2",
                quantity=sub.quantity,
                unit_price=float(plan.price),
                billing_cycle=sub.interval
            )
            subscription_lines.append(sl)

            # Billing Schedule Item
            bsi = BillingScheduleItem(
                id=f"bsi-{sub_id}",
                subscription_id=sub_id,
                due_date=sub.current_period_end,
                amount=float(plan.price) * sub.quantity,
                status="PAID" if st == "ACTIVE" else "PENDING"
            )
            billing_items.append(bsi)

        db.add_all(subscriptions)
        db.flush()
        db.add_all(subscription_lines)
        db.add_all(billing_items)
        db.commit()

        # ---------------------------------------------------------
        # 12. Invoices, Invoice Lines & Payments (70 Invoices, 55 Payments)
        # ---------------------------------------------------------
        print("12. Seeding 70 Invoices, Invoice Lines & Payments...")
        invoices = []
        invoice_lines = []
        payments = []
        inv_counter = 1
        pay_counter = 1

        for idx, o in enumerate(orders):
            inv_id = f"inv-{inv_counter:03d}"
            inv_counter += 1

            q = next((quote for quote in quotations if quote.id == o.quotation_id), None)
            subtot = q.subtotal if q else 100000.0
            tax = round(subtot * 0.18, 2)
            tot = round(subtot + tax, 2)

            is_paid = idx % 3 != 0
            inv_status = "PAID" if is_paid else "UNPAID"
            pay_status = "paid" if is_paid else "unpaid"
            amt_paid = tot if is_paid else 0.0

            inv = Invoice(
                id=inv_id,
                order_id=o.id,
                customer_id=q.deal.customer_id if (q and q.deal) else customers[0].id,
                status=inv_status,
                payment_status=pay_status,
                subtotal=subtot,
                total_discount=q.total_discount if q else 0.0,
                tax=tax,
                total=tot,
                amount_paid=amt_paid,
                created_at=o.created_at + timedelta(days=1),
                due_date=o.created_at + timedelta(days=30)
            )
            invoices.append(inv)

            # Add invoice line items
            il = InvoiceLine(
                id=f"il-{inv_id}-1",
                invoice_id=inv_id,
                product_id="p-laptop",
                description=f"Invoice for Order {o.id} - Enterprise Deliverables",
                quantity=1,
                unit_price=subtot,
                amount=subtot
            )
            invoice_lines.append(il)

            # Record payment if paid
            if is_paid:
                pay = Payment(
                    id=f"pay-{pay_counter:03d}",
                    invoice_id=inv_id,
                    amount=tot,
                    method=random.choice(["CREDIT_CARD", "BANK_TRANSFER", "CHEQUE"]),
                    status="COMPLETED",
                    created_at=inv.created_at + timedelta(days=random.randint(1, 15))
                )
                pay_counter += 1
                payments.append(pay)

        # Additional 15 subscription / standalone invoices to reach 70 total
        for idx in range(15):
            inv_id = f"inv-{inv_counter:03d}"
            inv_counter += 1
            cust = customers[idx % len(customers)]
            subtot = random.choice([25000.0, 50000.0, 75000.0])
            tax = round(subtot * 0.18, 2)
            tot = round(subtot + tax, 2)

            inv = Invoice(
                id=inv_id,
                order_id=None,
                customer_id=cust.id,
                status="PAID",
                payment_status="paid",
                subtotal=subtot,
                total_discount=0.0,
                tax=tax,
                total=tot,
                amount_paid=tot,
                created_at=random_date(180, 5),
                due_date=random_date(30, 0)
            )
            invoices.append(inv)

            il = InvoiceLine(
                id=f"il-{inv_id}-1",
                invoice_id=inv_id,
                product_id="p-2",
                description=f"Recurring SaaS Subscription Invoice #{inv_id}",
                quantity=1,
                unit_price=subtot,
                amount=subtot
            )
            invoice_lines.append(il)

            pay = Payment(
                id=f"pay-{pay_counter:03d}",
                invoice_id=inv_id,
                amount=tot,
                method="BANK_TRANSFER",
                status="COMPLETED",
                created_at=inv.created_at + timedelta(days=2)
            )
            pay_counter += 1
            payments.append(pay)

        db.add_all(invoices)
        db.flush()
        db.add_all(invoice_lines)
        db.add_all(payments)
        db.commit()

        # ---------------------------------------------------------
        # 13. Audit Events & Audit Logs (500+ Historical Events)
        # ---------------------------------------------------------
        print("13. Seeding 500+ Audit Events & Audit Logs...")
        audit_events = []
        audit_logs = []
        ae_counter = 1

        actions_list = [
            ("USER_CREATED", "User", "Created user account in workspace"),
            ("DEAL_CREATED", "Deal", "Created new enterprise opportunity"),
            ("QUOTATION_CREATED", "Quotation", "Generated quotation with commercial pricing"),
            ("DISCOUNT_CHANGED", "Quotation", "Adjusted line item discount percentage"),
            ("APPROVAL_REQUESTED", "ApprovalRequest", "Submitted high-discount quote for management approval"),
            ("APPROVAL_APPROVED", "ApprovalRequest", "Approved discount override requirement"),
            ("STOCK_ADJUSTED", "Stock", "Warehouse stock level updated via inventory check"),
            ("FULFILLMENT_CREATED", "FulfillmentAllocation", "Allocated warehouse stock for confirmed order"),
            ("ORDER_STATUS_CHANGED", "Order", "Updated order dispatch status"),
            ("NEGOTIATION_CREATED", "QuoteMessage", "Customer submitted counter-offer negotiation message"),
            ("INVOICE_CREATED", "Invoice", "Generated commercial invoice for delivered order"),
            ("PAYMENT_RECORDED", "Payment", "Payment successfully processed and verified")
        ]

        for idx in range(520):
            ae_id = f"ae-{ae_counter:04d}"
            ae_counter += 1
            action, entity_type, desc = random.choice(actions_list)
            u = random.choice(sales_reps + managers + finance_users + [admin_user])
            dt = random_date(365, 0)

            ae = AuditEvent(
                id=ae_id,
                user_id=u.id,
                action=action,
                entity_type=entity_type,
                entity_id=f"{entity_type.lower()}-{random.randint(1, 50)}",
                details=f"{desc} by {u.name} ({u.role})",
                created_at=dt
            )
            audit_events.append(ae)

            al = AuditLog(
                id=f"al-{ae_id}",
                actor_id=u.id,
                action=action,
                entity_type=entity_type,
                entity_id=ae.entity_id,
                details={"description": desc, "actor_email": u.email, "role": u.role},
                created_at=dt
            )
            audit_logs.append(al)

        db.add_all(audit_events)
        db.add_all(audit_logs)
        db.commit()

        # ---------------------------------------------------------
        # 14. Validation & Integrity Verification
        # ---------------------------------------------------------
        print("\n==========================================")
        print("Performing Comprehensive Integrity Checks")
        print("==========================================")

        deals_db = db.query(Deal).all()
        quotes_db = db.query(Quotation).all()
        lines_db = db.query(QuoteLine).all()
        apps_db = db.query(ApprovalRequest).all()
        orders_db = db.query(Order).all()
        stocks_db = db.query(Stock).all()
        invoices_db = db.query(Invoice).all()
        payments_db = db.query(Payment).all()
        subs_db = db.query(Subscription).all()
        messages_db = db.query(QuoteMessage).all()

        deal_ids_set = {d.id for d in deals_db}
        quote_ids_set = {q.id for q in quotes_db}
        quote_deal_ids_set = {q.deal_id for q in quotes_db}

        # 1. Every Deal has >= 1 Quotation
        deals_without_quote = [d for d in deals_db if d.id not in quote_deal_ids_set]
        assert len(deals_without_quote) == 0, f"FAILED: Found {len(deals_without_quote)} deals without quotation!"

        # 2. Every Quotation belongs to a valid Deal
        orphan_quotes = [q for q in quotes_db if q.deal_id not in deal_ids_set]
        assert len(orphan_quotes) == 0, f"FAILED: Found {len(orphan_quotes)} orphan quotations!"

        # 3. Every QuoteLine belongs to a valid Quotation
        orphan_lines = [l for l in lines_db if l.quotation_id not in quote_ids_set]
        assert len(orphan_lines) == 0, f"FAILED: Found {len(orphan_lines)} orphan quote lines!"

        # 4. Every Approval belongs to a valid Quotation
        orphan_apps = [a for a in apps_db if a.quotation_id not in quote_ids_set]
        assert len(orphan_apps) == 0, f"FAILED: Found {len(orphan_apps)} orphan approval requests!"

        # 5. Negative stock check
        negative_stocks = [s for s in stocks_db if s.quantity_on_hand < 0 or s.quantity_allocated < 0]
        assert len(negative_stocks) == 0, f"FAILED: Found {len(negative_stocks)} negative stock records!"

        # 6. Orphan orders
        orphan_orders = [o for o in orders_db if o.quotation_id not in quote_ids_set]
        assert len(orphan_orders) == 0, f"FAILED: Found {len(orphan_orders)} orphan orders!"

        # 7. Orphan invoices
        orphan_invoices = [i for i in invoices_db if i.order_id and i.order_id not in {o.id for o in orders_db}]
        assert len(orphan_invoices) == 0, f"FAILED: Found {len(orphan_invoices)} orphan invoices!"

        print("✔ ALL INTEGRITY CHECKS PASSED PERFECTLY!")

        # ---------------------------------------------------------
        # 15. Final Print Summary Table
        # ---------------------------------------------------------
        print("\n==========================================")
        print("DealFlow360 Database Seed Complete")
        print("==========================================")
        print(f"Organizations:       {db.query(OrganizationProfile).count()}")
        print(f"Users:               {db.query(User).count()}")
        print(f"Customers:           {db.query(Customer).count()}")
        print(f"Customer Tiers:      {db.query(CustomerTier).count()}")
        print(f"Categories:          {db.query(Category).count()}")
        print(f"Products:            {db.query(Product).count()}")
        print(f"Price Lists:         {db.query(PriceList).count()}")
        print(f"Discount Policies:   {db.query(DiscountPolicy).count()}")
        print(f"Approval Rules:      {db.query(ApprovalRule).count()}")
        print(f"Warehouses:          {db.query(Warehouse).count()}")
        print(f"Stock Records:       {db.query(Stock).count()}")
        print(f"Deals:               {db.query(Deal).count()}")
        print(f"Quotations:          {db.query(Quotation).count()}")
        print(f"Quotation Lines:     {db.query(QuoteLine).count()}")
        print(f"Approvals:           {db.query(ApprovalRequest).count()}")
        print(f"Orders:              {db.query(Order).count()}")
        print(f"Fulfillments:        {db.query(FulfillmentAllocation).count()}")
        print(f"Backorders:          {db.query(Backorder).count()}")
        print(f"Subscriptions:       {db.query(Subscription).count()}")
        print(f"Billing Schedules:   {db.query(BillingScheduleItem).count()}")
        print(f"Invoices:            {db.query(Invoice).count()}")
        print(f"Payments:            {db.query(Payment).count()}")
        print(f"Negotiations:        {db.query(QuoteMessage).count()}")
        print(f"Audit Events:        {db.query(AuditEvent).count()}")
        print("==========================================")
        print("Integrity Summary")
        print("==========================================")
        print(f"Deals without quotations:       0")
        print(f"Broken quotation relationships: 0")
        print(f"Invalid allocations:            0")
        print(f"Negative stock:                 0")
        print(f"Orphan orders:                  0")
        print(f"Orphan invoices:                0")
        print(f"Invalid negotiations:           0")
        print("==========================================")
        print("Seed completed successfully.")

    except Exception as e:
        db.rollback()
        print(f"ERROR during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
