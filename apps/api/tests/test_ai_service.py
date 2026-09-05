import pytest
from fastapi import HTTPException
from src.services.ai_service import ai_service

def test_ai_service_ollama_or_503():
    context = {
        "customer": {"name": "Test Customer", "tier": "Gold"},
        "quotation": {
            "subtotal": 100000.0,
            "total_discount": 20000.0,
            "total": 80000.0,
            "margin_percentage": 12.5,
            "risk_score": "HIGH",
            "requires_approval": True
        },
        "fulfillment": {
            "plans": [
                {
                    "name": "Single Warehouse (NY)",
                    "num_shipments": 1,
                    "eta": "2 Days"
                }
            ]
        }
    }
    
    try:
        res = ai_service.generate_explanation(context, role="sales")
        assert res["ai_status"] == "live_ollama"
        assert "summary" in res
        assert isinstance(res.get("risks"), list)
        assert isinstance(res.get("recommendations"), list)
    except HTTPException as exc:
        # If Ollama local service is unreachable/disabled in CI environment, 503 is returned (NO fake fallback)
        assert exc.status_code == 503
        assert exc.detail == "AI explanation service is currently unavailable."

def test_ai_service_disabled_raises_503():
    original_enabled = ai_service.enabled
    ai_service.enabled = False
    try:
        context = {"customer": {"name": "Test"}}
        with pytest.raises(HTTPException) as exc_info:
            ai_service.generate_explanation(context, role="sales")
        assert exc_info.value.status_code == 503
        assert exc_info.value.detail == "AI explanation service is currently unavailable."
    finally:
        ai_service.enabled = original_enabled
