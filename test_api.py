import requests

r1 = requests.post("http://localhost:8000/api/v1/auth/login", json={"email": "sales@dealflow360.com", "password": "sales123"})
token = r1.json()["access_token"]

r2 = requests.get("http://localhost:8000/api/v1/quotations", headers={"Authorization": f"Bearer {token}"})
print(r2.status_code)
print(r2.text)
