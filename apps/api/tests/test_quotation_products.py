from fastapi.testclient import TestClient

from src.main import app
from src.api.deps import get_db
from src.models.product import Product


def test_quotation_products_endpoint_returns_active_products(db_session):
    db_session.add_all([
        Product(id="p-active", name="Active Product", sku="ACTIVE", category="hardware", sales_price=100, cost=50, active=True),
        Product(id="p-inactive", name="Inactive Product", sku="INACTIVE", category="hardware", sales_price=200, cost=100, active=False),
    ])
    db_session.commit()

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        response = TestClient(app).get("/api/v1/quotations/products")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == [{
        "id": "p-active",
        "name": "Active Product",
        "sku": "ACTIVE",
        "category": "hardware",
        "sales_price": 100.0,
    }]