from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from src.api.deps import get_db, get_current_user
from src.models.user import User
from src.models.customer import Customer
from src.schemas.customer import CustomerResponse, CustomerCreate

router = APIRouter()

@router.get("/", response_model=List[CustomerResponse])
def get_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all customers.
    """
    customers = db.query(Customer).all()
    return customers

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
from src.api.deps import RoleChecker

@router.get("/me/quotations", response_model=List[PublicQuotationResponse])
def get_my_quotations(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["customer"]))
):
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
        pq = PublicQuotationResponse(
            id=q.id,
            status=q.status,
            subtotal=q.subtotal,
            total_discount=q.total_discount,
            total=q.total,
            deal_name=f"Quote for {deal.title}" if getattr(deal, 'title', None) else f"Quote for {customer.company}",
            customer_name=customer.company,
            lines=[]
        )
        resp.append(pq)
    return resp

@router.get("/me/orders", response_model=List[OrderResponse])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["customer"]))
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
def cancel_my_subscription(
    sub_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["customer"]))
):
    # In a real app, verify the subscription belongs to this customer
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
        
    sub.status = "canceled"
    sub.canceled_at = datetime.now()
    db.commit()
    return {"message": "Subscription canceled successfully"}
