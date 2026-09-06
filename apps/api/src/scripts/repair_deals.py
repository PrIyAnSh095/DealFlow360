import sys
import os

# Add root src directory to python path if executed directly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from sqlalchemy.orm import Session
from src.core.database import SessionLocal
from src.models.deal import Deal
from src.models.quotation import Quotation, QuoteLine
from src.models.product import Product
from src.services.pricing_service import recalculate_quotation

def repair_deals(db: Session):
    all_deals = db.query(Deal).all()
    deals_before_count = len(all_deals)
    
    deals_missing_quotations = []
    for deal in all_deals:
        quote_count = db.query(Quotation).filter(Quotation.deal_id == deal.id).count()
        if quote_count == 0:
            deals_missing_quotations.append(deal)

    missing_count = len(deals_missing_quotations)
    repaired_count = 0
    
    default_product = db.query(Product).first()
    
    if missing_count > 0:
        if not default_product:
            print("[ERROR] Cannot repair deals: No products exist in the database.")
            return {
                "before": deals_before_count,
                "missing": missing_count,
                "repaired": 0,
                "invalid": missing_count
            }

        for deal in deals_missing_quotations:
            try:
                quotation = Quotation(
                    deal_id=deal.id,
                    status="DRAFT",
                    subtotal=0.0,
                    total_discount=0.0,
                    total=0.0,
                    margin_percentage=0.0,
                    risk_score="LOW",
                    requires_approval=False
                )
                db.add(quotation)
                db.flush()

                q_line = QuoteLine(
                    quotation_id=quotation.id,
                    product_id=default_product.id,
                    quantity=1,
                    unit_price=default_product.sales_price,
                    discount_percent=0.0
                )
                db.add(q_line)
                db.flush()

                updated_q = recalculate_quotation(db, quotation)
                if deal.value is None or float(deal.value) == 0.0:
                    deal.value = updated_q.total
                deal.risk = updated_q.risk_score
                
                db.commit()
                repaired_count += 1
            except Exception as e:
                db.rollback()
                print(f"[REPAIR ERROR] Failed to repair deal {deal.id}: {e}")

    # Re-verify invalid deals
    still_invalid_count = 0
    for deal in db.query(Deal).all():
        if db.query(Quotation).filter(Quotation.deal_id == deal.id).count() == 0:
            still_invalid_count += 1

    report = {
        "before": deals_before_count,
        "missing": missing_count,
        "repaired": repaired_count,
        "invalid": still_invalid_count
    }

    print("==========================================")
    print("DEALFLOW360 - DEAL / QUOTATION REPAIR REPORT")
    print("==========================================")
    print(f"Deals before repair:  {report['before']}")
    print(f"Deals missing quotes: {report['missing']}")
    print(f"Deals repaired:       {report['repaired']}")
    print(f"Deals still invalid:  {report['invalid']}")
    print("==========================================")
    
    return report

if __name__ == "__main__":
    db = SessionLocal()
    try:
        repair_deals(db)
    finally:
        db.close()
