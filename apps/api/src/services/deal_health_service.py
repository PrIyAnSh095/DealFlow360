from typing import List, Dict
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from src.models.deal import Deal
from src.models.quotation import Quotation

def calculate_deal_health(db: Session, deal_id: str) -> Dict:
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        return {"health_score": 50, "risk_level": "UNKNOWN", "facts": ["Deal not found"]}

    quotation = db.query(Quotation).filter(Quotation.deal_id == deal_id).first()
    
    score = 85
    facts = []
    indicators = []

    # Signal 1: Stalled deal check
    if deal.created_at:
        days_open = (datetime.utcnow() - deal.created_at.replace(tzinfo=None)).days
        if days_open > 14 and deal.status not in ["won", "lost"]:
            score -= 20
            indicators.append("STALLED")
            facts.append(f"Deal has been open for {days_open} days without progress")

    # Signal 2: Discount anomaly check
    if quotation and quotation.total_discount > 0:
        disc_pct = (quotation.total_discount / quotation.subtotal * 100.0) if quotation.subtotal > 0 else 0
        if disc_pct > 20.0:
            score -= 25
            indicators.append("DISCOUNT_ANOMALY")
            facts.append(f"High discount requested ({disc_pct:.1f}%), eroding deal margin to {quotation.margin_percentage}%")

    # Signal 3: Margin risk check
    if quotation and quotation.margin_percentage < 20.0:
        score -= 15
        indicators.append("LOW_MARGIN")
        facts.append(f"Margin is below target threshold ({quotation.margin_percentage}%)")

    score = max(0, min(100, score))
    risk_level = "HIGH" if score < 50 else ("MEDIUM" if score < 75 else "LOW")

    return {
        "deal_id": deal_id,
        "customer_name": deal.customer_name,
        "health_score": score,
        "risk_level": risk_level,
        "indicators": indicators,
        "facts": facts or ["Deal parameters are within normal healthy thresholds"]
    }

def get_all_deal_health_metrics(db: Session) -> List[Dict]:
    deals = db.query(Deal).all()
    results = []
    for d in deals:
        results.append(calculate_deal_health(db, d.id))
    return results
