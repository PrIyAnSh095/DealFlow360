import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.api.deps import get_db, get_current_user, get_current_active_user
from src.models.user import User

def mock_get_sales_rep():
    return User(id="user-sales-1", email="rep@test.com", role="sales_rep", is_active=True)

def mock_get_finance_user():
    return User(id="user-fin-1", email="fin@test.com", role="finance", is_active=True)

def mock_get_admin_user():
    return User(id="user-admin-1", email="admin@test.com", role="admin", is_active=True)

def test_audit_logs_forbidden_for_non_admin(db_session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    client = TestClient(app)

    # Test Sales Rep -> 403
    app.dependency_overrides[get_current_user] = mock_get_sales_rep
    app.dependency_overrides[get_current_active_user] = mock_get_sales_rep
    res1 = client.get("/api/v1/admin/audit-logs")
    assert res1.status_code == 403

    # Test Finance -> 403
    app.dependency_overrides[get_current_user] = mock_get_finance_user
    app.dependency_overrides[get_current_active_user] = mock_get_finance_user
    res2 = client.get("/api/v1/admin/audit-logs")
    assert res2.status_code == 403

    app.dependency_overrides.clear()

def test_audit_logs_allowed_for_admin(db_session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_user] = mock_get_admin_user
    app.dependency_overrides[get_current_active_user] = mock_get_admin_user

    client = TestClient(app)
    res = client.get("/api/v1/admin/audit-logs")
    assert res.status_code == 200
    data = res.json()
    assert "total" in data
    assert "events" in data

    app.dependency_overrides.clear()
