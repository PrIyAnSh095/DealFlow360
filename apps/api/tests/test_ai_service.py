from src.services.ai_service import ai_service

def test_ai_service_fallback():
    context = {
        "deal": {"deal_id": "d-101"},
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
    
    res = ai_service.generate_explanation(context, role="sales")
    assert res["ai_status"] in ["fallback_engine", "live_ollama"]
    assert "summary" in res
    assert len(res["risks"]) > 0
    assert len(res["recommendations"]) > 0
    assert "margin_observation" in res or "margin_impact" in res
