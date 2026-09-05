from src.models.billing import Subscription, SubscriptionLine, BillingScheduleItem, Invoice
from src.models.operations import Order
from src.models.quotation import Quotation, QuoteLine
from src.models.product import Product
from src.services.billing_service import generate_billing_schedules, generate_invoice_from_order

def test_billing_schedule_generation(db_session):
    sub = Subscription(id="sub-test-1", customer_id="c-test-1", status="ACTIVE")
    db_session.add(sub)
    db_session.commit()

    generate_billing_schedules(db_session, "sub-test-1")
    items = db_session.query(BillingScheduleItem).filter(BillingScheduleItem.subscription_id == "sub-test-1").all()
    assert len(items) == 12
    assert items[0].status == "PAID"
    assert items[1].status == "PENDING"

def test_invoice_generation(db_session):
    p = Product(id="p-inv-1", name="License", sku="LIC-01", sales_price=1000.0, cost=200.0)
    q = Quotation(id="q-inv-1", deal_id="d-inv-1", subtotal=1000.0, total_discount=100.0, total=900.0)
    ql = QuoteLine(id="ql-inv-1", quotation_id="q-inv-1", product_id="p-inv-1", quantity=1, unit_price=1000.0, discount_percent=10.0)
    o = Order(id="o-inv-1", quotation_id="q-inv-1", status="fulfilled")
    
    db_session.add_all([p, q, ql, o])
    db_session.commit()

    inv = generate_invoice_from_order(db_session, o)
    assert inv.subtotal == 900.0
    assert inv.tax == 162.0 # 18% of 900
    assert inv.total == 1062.0
    assert inv.status == "UNPAID"
