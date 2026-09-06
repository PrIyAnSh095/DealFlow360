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


from fastapi.testclient import TestClient
from src.main import app
from src.api.deps import get_db, get_current_user
from src.models.customer import Customer
from src.models.user import User
from src.models.deal import Deal

def test_get_my_quotations_authenticated_and_isolation(db_session):
    # Setup Customer A & Customer B
    u_a = User(id="usr-cust-a", name="Alice", email="customerA@acme.com", password_hash="hash", role="customer", is_active=True)
    c_a = Customer(id="cust-a", name="Alice", company="Acme Corp", email="customerA@acme.com")
    d_a = Deal(id="deal-a", customer_id="cust-a", customer_name="Acme Corp", status="Quotation", value=2000.0)
    q_a = Quotation(id="quote-a", deal_id="deal-a", status="SENT", subtotal=2000.0, total=2000.0)
    p_a = Product(id="prod-a", name="Acme Widget", sku="ACME-W", sales_price=1000.0, cost=500.0)
    l_a = QuoteLine(id="line-a", quotation_id="quote-a", product_id="prod-a", quantity=2, unit_price=1000.0, discount_percent=0.0)

    u_b = User(id="usr-cust-b", name="Bob", email="customerB@beta.com", password_hash="hash", role="customer", is_active=True)
    c_b = Customer(id="cust-b", name="Bob", company="Beta LLC", email="customerB@beta.com")
    d_b = Deal(id="deal-b", customer_id="cust-b", customer_name="Beta LLC", status="Quotation", value=500.0)
    q_b = Quotation(id="quote-b", deal_id="deal-b", status="SENT", subtotal=500.0, total=500.0)

    db_session.add_all([u_a, c_a, d_a, q_a, p_a, l_a, u_b, c_b, d_b, q_b])
    db_session.commit()

    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db

    try:
        client = TestClient(app)

        # Customer A request
        app.dependency_overrides[get_current_user] = lambda: u_a
        res_a = client.get("/api/v1/customers/me/quotations")
        assert res_a.status_code == 200
        data_a = res_a.json()
        assert len(data_a) == 1
        assert data_a[0]["id"] == "quote-a"
        assert data_a[0]["customer_name"] == "Acme Corp"
        assert len(data_a[0]["lines"]) == 1
        assert data_a[0]["lines"][0]["product_name"] == "Acme Widget"
        assert data_a[0]["lines"][0]["quantity"] == 2

        # Customer B request (Isolation: Customer B sees ONLY quote-b, NOT quote-a)
        app.dependency_overrides[get_current_user] = lambda: u_b
        res_b = client.get("/api/v1/customers/me/quotations")
        assert res_b.status_code == 200
        data_b = res_b.json()
        assert len(data_b) == 1
        assert data_b[0]["id"] == "quote-b"
        assert data_b[0]["customer_name"] == "Beta LLC"

    finally:
        app.dependency_overrides.clear()


def test_get_my_quotations_no_quotations_empty_list(db_session):
    u_c = User(id="usr-cust-c", name="Charlie", email="customerC@empty.com", password_hash="hash", role="customer", is_active=True)
    c_c = Customer(id="cust-c", name="Charlie", company="Empty Co", email="customerC@empty.com")
    db_session.add_all([u_c, c_c])
    db_session.commit()

    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_user] = lambda: u_c

    try:
        client = TestClient(app)
        res = client.get("/api/v1/customers/me/quotations")
        assert res.status_code == 200
        assert res.json() == []
    finally:
        app.dependency_overrides.clear()


def test_get_my_quotations_unauthenticated():
    client = TestClient(app)
    res = client.get("/api/v1/customers/me/quotations")
    assert res.status_code in [401, 403]

