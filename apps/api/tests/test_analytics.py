import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.api.deps import get_db, get_current_user, get_current_active_user
from src.models.user import User

def mock_get_current_user():
    return User(id="user-analytics-1", email="analytics@test.com", role="admin", is_active=True)

def test_get_analytics_endpoint(db_session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_user] = mock_get_current_user
    app.dependency_overrides[get_current_active_user] = mock_get_current_user

    client = TestClient(app)
    
    # Test trailing slash and no-trailing-slash routes
    res1 = client.get("/api/v1/analytics/")
    assert res1.status_code == 200
    data1 = res1.json()
    assert "overview" in data1
    assert "revenue_trend" in data1
    assert "discount_trend" in data1

    res2 = client.get("/api/v1/analytics")
    assert res2.status_code == 200

    app.dependency_overrides.clear()
