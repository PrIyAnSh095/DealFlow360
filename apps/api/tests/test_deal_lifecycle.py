import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from src.main import app
from src.core.database import get_db
from src.core.security import create_access_token
from src.models.user import User
from src.models.deal import Deal
from src.models.quotation import Quotation, QuoteLine
from src.models.product import Product
from src.models.customer import Customer
from src.models.approval import ApprovalRequest

def test_deal_lifecycle_and_invariants(db_session: Session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    client = TestClient(app)

    # Setup test users in database
    sales_user = User(id="u-sales", name="Sales Rep", email="sales@test.com", password_hash="hash123", role="sales_rep", is_active=True)
    admin_user = User(id="u-admin", name="Admin User", email="admin@test.com", password_hash="hash123", role="admin", is_active=True)
    db_session.add(sales_user)
    db_session.add(admin_user)
    db_session.commit()

    sales_token = create_access_token({"sub": sales_user.id, "role": "sales_rep"})
    admin_token = create_access_token({"sub": admin_user.id, "role": "admin"})

    sales_headers = {
        "Authorization": f"Bearer {sales_token}",
        "X-User-Role": "sales_rep",
        "X-User-Id": "u-sales"
    }
    admin_headers = {
        "Authorization": f"Bearer {admin_token}",
        "X-User-Role": "admin",
        "X-User-Id": "u-admin"
    }

    # 1. Setup prerequisite product and customer
    cust = Customer(name="Lifecycle Customer", email="cust@lifecycle.com", company="Lifecycle Inc")
    prod = Product(name="Enterprise Engine", sku="ENG-001", category="Software", sales_price=50000.0, cost=10000.0, active=True)
    db_session.add(cust)
    db_session.add(prod)
    db_session.commit()
    db_session.refresh(cust)
    db_session.refresh(prod)

    # 2. Test Atomic Deal Creation automatically creates Quotation and QuoteLine
    deal_resp = client.post(
        "/api/v1/deals/",
        json={"customer_id": cust.id, "customer_name": cust.name, "value": 50000.0, "status": "draft"},
        headers=sales_headers
    )
    assert deal_resp.status_code == 201, deal_resp.text
    deal_data = deal_resp.json()
    deal_id = deal_data["id"]

    # Verify Invariant: COUNT(quotations WHERE deal_id = deal.id) >= 1
    quotes = db_session.query(Quotation).filter(Quotation.deal_id == deal_id).all()
    assert len(quotes) >= 1
    q0 = quotes[0]
    assert q0.deal_id == deal_id
    assert len(q0.lines) >= 1

    # 3. Test Quotation Submission with High Risk / Low Margin -> Moves Deal.status to "approval"
    q0.lines[0].discount_percent = 50.0
    db_session.commit()

    sub_resp = client.post(f"/api/v1/quotations/{q0.id}/submit", headers=sales_headers)
    assert sub_resp.status_code == 200, sub_resp.text
    sub_data = sub_resp.json()
    assert sub_data["status"] == "SUBMITTED_FOR_APPROVAL"

    db_session.refresh(q0)
    deal_in_db = db_session.query(Deal).filter(Deal.id == deal_id).first()
    assert deal_in_db.status == "approval"

    # 4. Test GET /api/v1/approvals returns the Deal and Quotation in approval queue
    app_resp = client.get("/api/v1/approvals/", headers=admin_headers)
    assert app_resp.status_code == 200, app_resp.text
    approvals_list = app_resp.json()
    matched_app = next((a for a in approvals_list if a["quotation_id"] == q0.id), None)
    assert matched_app is not None
    assert matched_app["status"] == "PENDING"
    assert matched_app["quote_total"] == q0.total

    # 5. Test Manager Approval -> Deal moves from "approval" to "negotiation"
    action_resp = client.post(
        f"/api/v1/approvals/{matched_app['id']}/approve",
        json={"reason": "Discount approved by VP"},
        headers=admin_headers
    )
    assert action_resp.status_code == 200, action_resp.text

    db_session.refresh(deal_in_db)
    assert deal_in_db.status == "negotiation"

    # 6. Test GET /api/v1/deals/ returns correct status for Kanban
    deals_list_resp = client.get("/api/v1/deals/", headers=sales_headers)
    assert deals_list_resp.status_code == 200, deals_list_resp.text
    deal_card = next((d for d in deals_list_resp.json() if d["id"] == deal_id), None)
    assert deal_card is not None
    assert deal_card["status"] == "negotiation"

    # 7. Test Rejection flow for another deal
    deal_b_resp = client.post(
        "/api/v1/deals/",
        json={"customer_id": cust.id, "customer_name": cust.name, "value": 20000.0, "status": "draft"},
        headers=sales_headers
    )
    deal_b_id = deal_b_resp.json()["id"]
    quote_b = db_session.query(Quotation).filter(Quotation.deal_id == deal_b_id).first()
    quote_b.lines[0].discount_percent = 50.0
    db_session.commit()

    client.post(f"/api/v1/quotations/{quote_b.id}/submit", headers=sales_headers)

    app_b_list = client.get("/api/v1/approvals/", headers=admin_headers).json()
    app_b = next(a for a in app_b_list if a["quotation_id"] == quote_b.id)

    rej_resp = client.post(
        f"/api/v1/approvals/{app_b['id']}/reject",
        json={"reason": "Margin too low"},
        headers=admin_headers
    )
    assert rej_resp.status_code == 200, rej_resp.text
    deal_b_db = db_session.query(Deal).filter(Deal.id == deal_b_id).first()
    assert deal_b_db.status == "lost"

    app.dependency_overrides.clear()
