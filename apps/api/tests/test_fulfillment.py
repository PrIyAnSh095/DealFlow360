from src.models.operations import Warehouse, Stock, Order
from src.models.product import Product
from src.models.quotation import Quotation, QuoteLine
from src.services.fulfillment_service import generate_fulfillment_plans
from src.services.inventory_service import allocate_stock_for_order

def test_multi_warehouse_allocation_and_backorder(db_session):
    w1 = Warehouse(id="w-test-1", name="NY", location="NY")
    w2 = Warehouse(id="w-test-2", name="SF", location="SF")
    db_session.add_all([w1, w2])

    p = Product(id="p-ful-1", name="Laptop", sku="LAP-01", sales_price=1000.0, cost=600.0)
    db_session.add(p)
    
    # 6 units in W1, 2 units in W2
    s1 = Stock(id="st-1", product_id="p-ful-1", warehouse_id="w-test-1", quantity_on_hand=6, quantity_allocated=0)
    s2 = Stock(id="st-2", product_id="p-ful-1", warehouse_id="w-test-2", quantity_on_hand=2, quantity_allocated=0)
    db_session.add_all([s1, s2])
    db_session.commit()

    q = Quotation(id="q-ful-1", deal_id="d-ful-1", total=10000.0)
    ql = QuoteLine(id="ql-ful-1", quotation_id="q-ful-1", product_id="p-ful-1", quantity=10, unit_price=1000.0)
    order = Order(id="o-ful-1", quotation_id="q-ful-1", status="pending_fulfillment")
    db_session.add_all([q, ql, order])
    db_session.commit()

    # Requested 10 units: W1=6, W2=2 -> Backorder = 2
    allocations, backorder_qty = allocate_stock_for_order(
        db_session,
        order_id="o-ful-1",
        quote_line_id="ql-ful-1",
        product_id="p-ful-1",
        requested_qty=10,
        warehouse_allocations={"w-test-1": 6, "w-test-2": 2}
    )

    assert backorder_qty == 2
    assert len(allocations) == 3 # 2 warehouse allocations + 1 backorder allocation
    assert s1.quantity_allocated == 6
    assert s2.quantity_allocated == 2

def test_generate_fulfillment_plans(db_session):
    w1 = Warehouse(id="w-plan-1", name="Hub 1", location="NY")
    p = Product(id="p-plan-1", name="Server", sku="SRV-PL", sales_price=5000.0, cost=3000.0)
    s = Stock(id="st-plan-1", product_id="p-plan-1", warehouse_id="w-plan-1", quantity_on_hand=10)
    q = Quotation(id="q-plan-1", deal_id="d-plan-1", total=5000.0)
    ql = QuoteLine(id="ql-plan-1", quotation_id="q-plan-1", product_id="p-plan-1", quantity=1, unit_price=5000.0)
    o = Order(id="o-plan-1", quotation_id="q-plan-1", status="pending_fulfillment")
    
    db_session.add_all([w1, p, s, q, ql, o])
    db_session.commit()

    result = generate_fulfillment_plans(db_session, "o-plan-1")
    assert "plans" in result
    assert len(result["plans"]) > 0
    assert "deal_margin" in result["plans"][0]
