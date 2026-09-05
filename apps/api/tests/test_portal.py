from src.models.quotation import Quotation, QuoteLine
from src.models.product import Product
from src.services.negotiation_service import process_customer_counter_offer

def test_customer_portal_counter_offer_and_reapproval(db_session):
    p = Product(id="p-port-1", name="Software Suite", sku="SW-PORT", sales_price=1000.0, cost=200.0)
    q = Quotation(id="q-port-1", deal_id="d-port-1", status="SENT", subtotal=1000.0, total=1000.0, margin_percentage=80.0, risk_score="LOW", requires_approval=False)
    ql = QuoteLine(id="ql-port-1", quotation_id="q-port-1", product_id="p-port-1", quantity=1, unit_price=1000.0, discount_percent=0.0)
    
    db_session.add_all([p, q, ql])
    db_session.commit()

    # Customer counters with a 35% discount (high risk -> triggers approval requirement)
    updated = process_customer_counter_offer(
        db_session,
        quotation_id="q-port-1",
        line_discounts={"ql-port-1": 35.0},
        message="Please reduce price to $650"
    )

    assert updated.total_discount == 350.0
    assert updated.total == 650.0
    assert updated.risk_score == "HIGH"
    assert updated.requires_approval is True
    assert updated.status == "PENDING_APPROVAL"
