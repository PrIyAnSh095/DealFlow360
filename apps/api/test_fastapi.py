from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)
r1 = client.post("/api/v1/auth/login", json={"email": "admin@dealflow360.com", "password": "admin123"})
token = r1.json()["access_token"]

try:
    r2 = client.get("/api/v1/approvals", headers={"Authorization": f"Bearer {token}"})
    print(r2.status_code, r2.text)
except Exception as e:
    import traceback
    traceback.print_exc()
