import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.api.deps import get_db, get_current_user as deps_get_current_user, get_current_active_user
from src.core.security import get_current_user as sec_get_current_user
from src.models.user import User
from src.models.customer import Customer, CustomerTier
from src.models.deal import Deal
from src.models.quotation import Quotation, QuoteLine
from src.models.operations import Order
from src.models.portal import QuoteMessage
from src.models.product import Product

def create_user(id_val: str, email: str, role: str = "sales_rep", name: str = "Sales Rep"):
    return User(id=id_val, email=email, role=role, name=name, password_hash="hashed_pw_test", is_active=True)

def setup_auth_overrides(user: User):
    app.dependency_overrides[deps_get_current_user] = lambda: user
    app.dependency_overrides[get_current_active_user] = lambda: user
    app.dependency_overrides[sec_get_current_user] = lambda: {"sub": user.id, "role": user.role, "id": user.id}

def test_deal_creation_ownership_assignment(db_session):
    sales_rep_1 = create_user("rep-1", "rep1@dealflow360.com")

    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    setup_auth_overrides(sales_rep_1)

    customer = Customer(id="c-test-1", name="Acme Corp", email="acme@test.com", company="Acme Corp")
    prod = Product(id="prod-default-1", name="Default Server", sku="DEF-001", sales_price=100.0, cost=50.0)
    db_session.add_all([sales_rep_1, customer, prod])
    db_session.commit()

    client = TestClient(app)
    response = client.post("/api/v1/deals/", json={
        "customer_id": "c-test-1",
        "customer_name": "Acme Corp",
        "value": 50000.0,
        "risk": "low"
    })
    assert response.status_code == 201
    deal_data = response.json()
    assert deal_data["owner_id"] == sales_rep_1.id

    app.dependency_overrides.clear()

def test_sales_rep_deal_status_update_valid_and_invalid(db_session):
    sales_rep_1 = create_user("rep-1", "rep1@dealflow360.com")
    sales_rep_2 = create_user("rep-2", "rep2@dealflow360.com")

    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    setup_auth_overrides(sales_rep_1)

    customer = Customer(id="c-test-2", name="Beta LLC", email="beta@test.com", company="Beta LLC")
    deal = Deal(id="d-test-1", customer_id="c-test-2", customer_name="Beta LLC", owner_id=sales_rep_1.id, value=15000.0, status="draft")
    db_session.add_all([sales_rep_1, sales_rep_2, customer, deal])
    db_session.commit()

    client = TestClient(app)

    # Invalid transition (draft -> completed)
    invalid_resp = client.patch(f"/api/v1/deals/{deal.id}", json={"status": "completed"})
    assert invalid_resp.status_code == 400
    assert "Invalid deal status transition" in invalid_resp.json()["detail"]

    # IDOR check: rep_2 tries to update rep_1's deal
    setup_auth_overrides(sales_rep_2)
    unauth_resp = client.patch(f"/api/v1/deals/{deal.id}", json={"status": "review"})
    assert unauth_resp.status_code == 403

    # Valid transition (draft -> review) by rep_1
    setup_auth_overrides(sales_rep_1)
    valid_resp = client.patch(f"/api/v1/deals/{deal.id}", json={"status": "review"})
    assert valid_resp.status_code == 200
    assert valid_resp.json()["status"] == "review"

    app.dependency_overrides.clear()

def test_sales_rep_order_delivery_status_update_idor(db_session):
    sales_rep_1 = create_user("rep-1", "rep1@dealflow360.com")
    sales_rep_2 = create_user("rep-2", "rep2@dealflow360.com")

    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db

    customer = Customer(id="c-test-3", name="Gamma Inc", email="gamma@test.com", company="Gamma Inc", assigned_sales_rep_id=sales_rep_1.id)
    deal = Deal(id="d-test-2", customer_id="c-test-3", customer_name="Gamma Inc", owner_id=sales_rep_1.id, value=20000.0, status="won")
    quote = Quotation(id="q-test-1", deal_id=deal.id, status="accepted", total=20000.0)
    order = Order(id="ord-test-1", quotation_id=quote.id, status="pending_fulfillment")

    db_session.add_all([sales_rep_1, sales_rep_2, customer, deal, quote, order])
    db_session.commit()

    client = TestClient(app)

    # Unauthorized rep_2 attempt -> 403
    setup_auth_overrides(sales_rep_2)
    unauth_resp = client.patch(f"/api/v1/operations/orders/{order.id}/status", json={"status": "shipped"})
    assert unauth_resp.status_code == 403

    # Authorized rep_1 attempt -> 200
    setup_auth_overrides(sales_rep_1)
    auth_resp = client.patch(f"/api/v1/operations/orders/{order.id}/status", json={"status": "shipped"})
    assert auth_resp.status_code == 200
    assert auth_resp.json()["status"] == "shipped"

    app.dependency_overrides.clear()

def test_customer_counter_offer_routing_to_assigned_sales_rep(db_session):
    sales_rep_1 = create_user("rep-1", "rep1@dealflow360.com")
    sales_rep_2 = create_user("rep-2", "rep2@dealflow360.com")

    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db

    customer = Customer(id="c-test-4", name="Delta Co", email="delta@test.com", company="Delta Co", assigned_sales_rep_id=sales_rep_1.id)
    deal = Deal(id="d-test-3", customer_id="c-test-4", customer_name="Delta Co", owner_id=sales_rep_1.id, value=30000.0, status="negotiation")
    quote = Quotation(id="q-test-2", deal_id=deal.id, status="sent", total=30000.0)
    msg = QuoteMessage(id="msg-test-1", quotation_id=quote.id, content="Can we get a 15% discount?", sender_type="CUSTOMER", status="PENDING_REP_RESPONSE")

    db_session.add_all([sales_rep_1, sales_rep_2, customer, deal, quote, msg])
    db_session.commit()

    client = TestClient(app)

    # Assigned rep_1 sees negotiation item
    setup_auth_overrides(sales_rep_1)
    resp1 = client.get("/api/v1/negotiations/")
    assert resp1.status_code == 200
    items1 = resp1.json()
    assert len(items1) == 1
    assert items1[0]["id"] == msg.id

    # Unassigned rep_2 sees 0 negotiation items
    setup_auth_overrides(sales_rep_2)
    resp2 = client.get("/api/v1/negotiations/")
    assert resp2.status_code == 200
    assert len(resp2.json()) == 0

    app.dependency_overrides.clear()

def test_sales_rep_respond_negotiation_reapproval(db_session):
    sales_rep_1 = create_user("rep-1", "rep1@dealflow360.com")

    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    setup_auth_overrides(sales_rep_1)

    tier = CustomerTier(id="t-bronze", name="Bronze", min_spend=0.0, max_discount_pct=5.0)
    customer = Customer(id="c-test-5", name="Epsilon Ltd", email="epsilon@test.com", company="Epsilon Ltd", tier_id="t-bronze", assigned_sales_rep_id=sales_rep_1.id)
    deal = Deal(id="d-test-4", customer_id="c-test-5", customer_name="Epsilon Ltd", owner_id=sales_rep_1.id, value=10000.0, status="negotiation")
    product = Product(id="prod-test-1", name="Storage Unit", sku="SU-100", sales_price=100.0, cost=50.0)
    quote = Quotation(id="q-test-3", deal_id=deal.id, status="sent", subtotal=10000.0, total_discount=0.0, total=10000.0)
    line = QuoteLine(id="ql-test-1", quotation_id=quote.id, product_id=product.id, unit_price=100.0, quantity=100, discount_percent=0.0)
    msg = QuoteMessage(id="msg-test-2", quotation_id=quote.id, content="Requesting 12% discount", sender_type="CUSTOMER", status="PENDING_REP_RESPONSE")

    db_session.add_all([sales_rep_1, tier, customer, deal, product, quote, line, msg])
    db_session.commit()

    client = TestClient(app)

    # Sales Rep counters with 20% discount (exceeds 15% threshold -> triggers re-approval)
    response = client.post(f"/api/v1/negotiations/{msg.id}/respond", json={
        "action": "COUNTER",
        "message": "We can offer 20% discount.",
        "counter_discount_pct": 20.0
    })
    assert response.status_code == 200
    assert response.json()["requires_approval"] is True

    # Verify deal status changed to approval
    db_session.refresh(deal)
    assert deal.status == "approval"

    app.dependency_overrides.clear()
