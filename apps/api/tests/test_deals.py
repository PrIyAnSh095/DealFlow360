import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.api.deps import get_db, get_current_user, get_current_active_user
from src.models.deal import Deal
from src.models.customer import Customer, CustomerTier
from src.models.user import User

def get_mock_user():
    return User(id="user-test-1", email="test@example.com", role="sales_rep", is_active=True)

def test_get_deals_empty(db_session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_user] = get_mock_user
    app.dependency_overrides[get_current_active_user] = get_mock_user

    client = TestClient(app)
    response = client.get("/api/v1/deals/")
    assert response.status_code == 200
    assert response.json() == []

    app.dependency_overrides.clear()

def test_get_deals_with_nullable_relationships(db_session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_user] = get_mock_user
    app.dependency_overrides[get_current_active_user] = get_mock_user

    # Customer with null company and null tier_id
    c = Customer(id="c-null-1", name="Acme Null", email="null@acme.com", company=None, tier_id=None)
    db_session.add(c)
    db_session.commit()

    # Deal with customer_id=None
    d1 = Deal(id="d-null-1", customer_id=None, customer_name="Direct Lead", value=15000.0, status="draft", risk="low")
    # Deal with customer_id referencing c-null-1
    d2 = Deal(id="d-null-2", customer_id="c-null-1", customer_name="Acme Deal", value=25000.0, status="negotiation", risk="medium")
    db_session.add_all([d1, d2])
    db_session.commit()

    client = TestClient(app)
    response = client.get("/api/v1/deals/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    
    deal1 = next(item for item in data if item["id"] == "d-null-1")
    assert deal1["customer_id"] is None
    assert deal1["customer"] is None

    deal2 = next(item for item in data if item["id"] == "d-null-2")
    assert deal2["customer_id"] == "c-null-1"
    assert deal2["customer"]["name"] == "Acme Null"
    assert deal2["customer"]["company"] is None
    assert deal2["customer"]["tier"] is None

    app.dependency_overrides.clear()

def test_get_deal_by_id(db_session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_user] = get_mock_user
    app.dependency_overrides[get_current_active_user] = get_mock_user

    tier = CustomerTier(id="t-gold", name="Gold", min_spend=10000.0, max_discount_pct=20.0)
    c = Customer(id="c-101", name="Enterprise Client", email="ent@client.com", company="Enterprise Inc", tier_id="t-gold")
    d = Deal(id="d-101", customer_id="c-101", value=50000.0, status="won", risk="low")
    db_session.add_all([tier, c, d])
    db_session.commit()

    client = TestClient(app)
    response = client.get("/api/v1/deals/d-101")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "d-101"
    assert data["customer"]["tier"]["name"] == "Gold"

    app.dependency_overrides.clear()

def test_get_deals_unauthenticated(db_session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db

    client = TestClient(app)
    response = client.get("/api/v1/deals/")
    # Unauthenticated request should return 401, NOT 500
    assert response.status_code == 401

    app.dependency_overrides.clear()
