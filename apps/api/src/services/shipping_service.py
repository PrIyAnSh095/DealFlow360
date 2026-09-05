import os
import requests
from typing import List, Dict, Optional
from datetime import datetime, timedelta

class InternalRateCardAdapter:
    """
    Fallback offline shipping rate card adapter.
    Used when Shiprocket is unavailable or credentials are not configured.
    """
    def get_rates(self, pickup_pincode: str, delivery_pincode: str, weight_kg: float) -> List[Dict]:
        return [
            {
                "courier_id": "express-01",
                "courier_name": "Express Courier Service",
                "rate": round(250.0 + (weight_kg * 45.0), 2),
                "estimated_delivery_days": 2,
                "eta": (datetime.utcnow() + timedelta(days=2)).strftime("%Y-%m-%d"),
                "adapter": "InternalRateCard"
            },
            {
                "courier_id": "standard-02",
                "courier_name": "Standard Surface Logistics",
                "rate": round(120.0 + (weight_kg * 25.0), 2),
                "estimated_delivery_days": 4,
                "eta": (datetime.utcnow() + timedelta(days=4)).strftime("%Y-%m-%d"),
                "adapter": "InternalRateCard"
            },
            {
                "courier_id": "freight-03",
                "courier_name": "Economy Freight Line",
                "rate": round(80.0 + (weight_kg * 15.0), 2),
                "estimated_delivery_days": 6,
                "eta": (datetime.utcnow() + timedelta(days=6)).strftime("%Y-%m-%d"),
                "adapter": "InternalRateCard"
            }
        ]

class ShiprocketAdapter:
    """
    Live Shiprocket API Integration Adapter.
    Handles token authentication server-side without exposing credentials.
    """
    def __init__(self):
        self.base_url = os.environ.get("SHIPROCKET_BASE_URL", "https://apiv2.shiprocket.in/v1/external")
        self.email = os.environ.get("SHIPROCKET_EMAIL", "")
        self.password = os.environ.get("SHIPROCKET_PASSWORD", "")
        self.token = None
        self.token_expiry = None

    def authenticate(self) -> bool:
        if not self.email or not self.password:
            return False
            
        try:
            url = f"{self.base_url}/auth/login"
            payload = {"email": self.email, "password": self.password}
            headers = {"Content-Type": "application/json"}
            resp = requests.post(url, json=payload, headers=headers, timeout=5)
            
            if resp.status_code == 200:
                data = resp.json()
                self.token = data.get("token")
                self.token_expiry = datetime.utcnow() + timedelta(hours=24)
                return True
        except Exception:
            pass
        return False

    def get_rates(self, pickup_pincode: str, delivery_pincode: str, weight_kg: float) -> Optional[List[Dict]]:
        if not self.token and not self.authenticate():
            return None

        try:
            url = f"{self.base_url}/courier/serviceability/"
            params = {
                "pickup_postcode": pickup_pincode,
                "delivery_postcode": delivery_pincode,
                "weight": weight_kg,
                "cod": 0
            }
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.token}"
            }
            resp = requests.get(url, params=params, headers=headers, timeout=5)
            
            if resp.status_code == 200:
                data = resp.json()
                couriers = data.get("data", {}).get("available_courier_companies", [])
                results = []
                for c in couriers:
                    results.append({
                        "courier_id": str(c.get("courier_company_id")),
                        "courier_name": c.get("courier_name"),
                        "rate": float(c.get("rate", 0.0)),
                        "estimated_delivery_days": int(c.get("etd", 3)),
                        "eta": c.get("etd_hours", "72 hours"),
                        "adapter": "Shiprocket"
                    })
                return results
        except Exception:
            pass
        return None

class ShippingService:
    def __init__(self):
        self.shiprocket_adapter = ShiprocketAdapter()
        self.fallback_adapter = InternalRateCardAdapter()

    def get_shipping_rates(self, pickup_pincode: str = "110001", delivery_pincode: str = "400001", weight_kg: float = 5.0) -> List[Dict]:
        """
        Attempts to fetch live Shiprocket rates first.
        Falls back to InternalRateCardAdapter if Shiprocket is unavailable or credentials missing.
        """
        rates = self.shiprocket_adapter.get_rates(pickup_pincode, delivery_pincode, weight_kg)
        if rates is not None and len(rates) > 0:
            return rates
        return self.fallback_adapter.get_rates(pickup_pincode, delivery_pincode, weight_kg)

shipping_service = ShippingService()
