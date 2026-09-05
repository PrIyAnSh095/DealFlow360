from src.services.shipping_service import shipping_service, InternalRateCardAdapter

def test_shipping_service_fallback():
    rates = shipping_service.get_shipping_rates("110001", "400001", 5.0)
    assert len(rates) > 0
    assert "rate" in rates[0]
    assert "courier_name" in rates[0]
    assert rates[0]["adapter"] in ["InternalRateCard", "Shiprocket"]

def test_internal_rate_card_calculation():
    adapter = InternalRateCardAdapter()
    rates = adapter.get_rates("110001", "400001", 10.0)
    assert len(rates) == 3
    assert rates[0]["rate"] == 700.0 # 250 + (10 * 45)
