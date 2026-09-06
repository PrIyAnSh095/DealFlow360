import requests
try:
    res = requests.post("http://localhost:8000/api/v1/auth/login", json={"email": "admin@dealflow360.com", "password": "password"})
    print(res.status_code)
    print(res.text)
except Exception as e:
    print(e)
