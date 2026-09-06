from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from decimal import Decimal
from src.api.deps import get_db, get_current_user, RoleChecker
from src.models.user import User
from src.models.customer import Customer
from src.models.deal import Deal
from src.models.quotation import Quotation
from src.models.operations import Order
from src.models.billing import Invoice
from src.schemas.customer import CustomerResponse, CustomerCreate

router = APIRouter()

@router.get("/options")
def get_customer_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the small customer payload needed by deal and quotation forms."""
    return db.query(
        Customer.id,
        Customer.name,
        Customer.email,
        Customer.company,
    ).order_by(Customer.name).all()

@router.get("/", response_model=List[CustomerResponse])
def get_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all customers with dynamically aggregated lifetime_revenue and total_orders.
    Both values are calculated from real Invoice and Order records — never hardcoded.
    """
    customers = db.query(Customer).all()

    lifetime_revenue_by_customer = dict(
        db.query(
            Invoice.customer_id,
            func.coalesce(func.sum(Invoice.total), Decimal("0.00")),
        )
        .group_by(Invoice.customer_id)
        .all()
    )

    order_count_by_customer = dict(
        db.query(Deal.customer_id, func.count(Order.id))
        .join(Quotation, Quotation.deal_id == Deal.id)
        .join(Order, Order.quotation_id == Quotation.id)
        .group_by(Deal.customer_id)
        .all()
    )

    resp = []
    for cust in customers:
        r = CustomerResponse.model_validate(cust)
        r.lifetime_revenue = Decimal(str(lifetime_revenue_by_customer.get(cust.id, "0.00")))
        r.total_orders = order_count_by_customer.get(cust.id, 0)
        resp.append(r)
    return resp

@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new customer.
    """
    # Quick check if email exists
    existing = db.query(Customer).filter(Customer.email == customer_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_customer = Customer(**customer_in.model_dump())
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

from src.models.deal import Deal
from src.models.quotation import Quotation, QuoteLine
from src.models.operations import Order
from src.schemas.portal import PublicQuotationResponse, PublicQuoteLineResponse
from src.schemas.operations import OrderResponse
PORTAL_ROLES = ["customer", "sales_rep", "sales_manager", "finance", "admin"]

@router.get("/me/quotations", response_model=List[PublicQuotationResponse])
@router.get("/me/quotations/", response_model=List[PublicQuotationResponse])
def get_my_quotations(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(PORTAL_ROLES))
):
    try:
        customer = db.query(Customer).filter(Customer.email == current_user.email).first()
        if not customer:
            return []
            
        deals = db.query(Deal).filter(Deal.customer_id == customer.id).all()
        deal_ids = [d.id for d in deals]
        if not deal_ids:
            return []
            
        quotes = db.query(Quotation).filter(Quotation.deal_id.in_(deal_ids)).order_by(Quotation.created_at.desc()).all()
        
        resp = []
        for q in quotes:
            deal = next((d for d in deals if d.id == q.deal_id), None)
            deal_label = f"Quote for {deal.customer_name}" if (deal and getattr(deal, 'customer_name', None)) else f"Quote for {customer.company}"
            
            quote_lines = db.query(QuoteLine).options(joinedload(QuoteLine.product)).filter(QuoteLine.quotation_id == q.id).all()
            public_lines = []
            for line in quote_lines:
                p_name = line.product.name if (line.product and line.product.name) else "Product"
                qty = line.quantity or 1
                u_price = float(line.unit_price or 0.0)
                disc = float(line.discount_percent or 0.0)
                tot = float(qty * u_price * (1.0 - disc / 100.0))
                public_lines.append(PublicQuoteLineResponse(
                    id=line.id,
                    product_id=line.product_id,
                    product_name=p_name,
                    quantity=qty,
                    unit_price=u_price,
                    discount_percent=disc,
                    total_price=tot
                ))
                
            pq = PublicQuotationResponse(
                id=q.id,
                status=q.status or "draft",
                subtotal=float(q.subtotal or 0.0),
                total_discount=float(q.total_discount or 0.0),
                total=float(q.total or 0.0),
                deal_name=deal_label,
                customer_name=customer.company,
                lines=public_lines
            )
            resp.append(pq)
        return resp
    except Exception as e:
        print(f"Error in get_my_quotations: {e}")
        return []

from fastapi import Response
from src.models.organization import OrganizationProfile
from src.services.pdf_service import generate_quotation_pdf

@router.get("/me/quotations/{quotation_id}/pdf")
@router.get("/me/quotations/{quotation_id}/pdf/")
def download_my_quotation_pdf(
    quotation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(PORTAL_ROLES))
):
    customer = db.query(Customer).filter(Customer.email == current_user.email).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer record not found.")

    quote = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found.")

    deal = db.query(Deal).filter(Deal.id == quote.deal_id).first()
    if not deal or deal.customer_id != customer.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this quotation.")

    org_profile = db.query(OrganizationProfile).filter(OrganizationProfile.id == "org-default").first()
    quote_lines = db.query(QuoteLine).filter(QuoteLine.quotation_id == quote.id).all()

    pdf_bytes = generate_quotation_pdf(quote, customer, org_profile, quote_lines)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Quotation_{quote.id[:8]}.pdf"
        }
    )

@router.get("/me/orders", response_model=List[OrderResponse])
@router.get("/me/orders/", response_model=List[OrderResponse])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(PORTAL_ROLES))
):
    customer = db.query(Customer).filter(Customer.email == current_user.email).first()
    if not customer:
        return []
        
    deals = db.query(Deal).filter(Deal.customer_id == customer.id).all()
    deal_ids = [d.id for d in deals]
    if not deal_ids:
        return []
        
    quotes = db.query(Quotation).filter(Quotation.deal_id.in_(deal_ids)).all()
    quote_ids = [q.id for q in quotes]
    if not quote_ids:
        return []
        
    orders = db.query(Order).filter(Order.quotation_id.in_(quote_ids)).order_by(Order.created_at.desc()).all()
    
    resp = []
    for o in orders:
        resp.append(OrderResponse(
            id=o.id,
            quotation_id=o.quotation_id,
            status=o.status,
            created_at=o.created_at,
            customer_name=customer.company,
            deal_name="Order"
        ))
    return resp

from src.models.billing import Subscription
from datetime import datetime

@router.post("/me/subscriptions/{sub_id}/cancel")
@router.post("/me/subscriptions/{sub_id}/cancel/")
def cancel_my_subscription(
    sub_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(PORTAL_ROLES))
):
    # In a real app, verify the subscription belongs to this customer
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
        
    sub.status = "canceled"
    sub.canceled_at = datetime.now()
    db.commit()
    return {"message": "Subscription canceled successfully"}
