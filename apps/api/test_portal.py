from src.main import app
from src.core.database import SessionLocal
from src.api.v1.portal import get_public_quote_or_404

db = SessionLocal()
try:
    quote, deal = get_public_quote_or_404("d-1", db)
    print("SUCCESS")
    print(quote.id)
    print(deal.id)
except Exception as e:
    print(f"FAILED: {e}")
    if hasattr(e, "detail"):
        print(f"DETAIL: {e.detail}")
    print(f"FAILED: {e}")
    if hasattr(e, "detail"):
        print(f"DETAIL: {e.detail}")
