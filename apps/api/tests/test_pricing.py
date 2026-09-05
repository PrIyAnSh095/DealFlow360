from src.models.product import Product
from src.models.quotation import Quotation, QuoteLine
from src.services.pricing_service import recalculate_quotation

def test_recalculate_quotation_low_risk(db_session):
    p = Product(id="p-test-1", name="Test Product", sku="TEST-01", sales_price=100.0, cost=50.0)
    db_session.add(p)
    db_session.commit()

    q = Quotation(id="q-test-1", deal_id="d-test-1")
    db_session.add(q)
    db_session.commit()

    ql = QuoteLine(id="ql-test-1", quotation_id="q-test-1", product_id="p-test-1", quantity=10, unit_price=100.0, discount_percent=5.0)
    db_session.add(ql)
    db_session.commit()

    updated = recalculate_quotation(db_session, q)

    assert updated.subtotal == 1000.0
    assert updated.total_discount == 50.0
    assert updated.total == 950.0
    assert updated.margin_percentage == 47.37 # (950 - 500) / 950 * 100
    assert updated.risk_score == "LOW"
    assert updated.requires_approval is False

def test_recalculate_quotation_high_risk_discount(db_session):
    p = Product(id="p-test-2", name="Server", sku="SRV-01", sales_price=1000.0, cost=600.0)
    db_session.add(p)
    db_session.commit()

    q = Quotation(id="q-test-2", deal_id="d-test-2")
    db_session.add(q)
    db_session.commit()

    ql = QuoteLine(id="ql-test-2", quotation_id="q-test-2", product_id="p-test-2", quantity=1, unit_price=1000.0, discount_percent=30.0)
    db_session.add(ql)
    db_session.commit()

    updated = recalculate_quotation(db_session, q)

    assert updated.total_discount == 300.0
    assert updated.risk_score == "HIGH"
    assert updated.requires_approval is True
