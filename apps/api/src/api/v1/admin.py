from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.models.product import Product
from src.models.pricing import Category, PriceList, DiscountPolicy, ApprovalRule
from src.models.customer import CustomerTier, Customer

router = APIRouter()

@router.get("/products")
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).all()

@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@router.get("/customer-tiers")
def list_customer_tiers(db: Session = Depends(get_db)):
    return db.query(CustomerTier).all()

@router.get("/customers")
def list_customers(db: Session = Depends(get_db)):
    return db.query(Customer).all()

@router.get("/discount-policies")
def list_discount_policies(db: Session = Depends(get_db)):
    return db.query(DiscountPolicy).all()

@router.get("/approval-rules")
def list_approval_rules(db: Session = Depends(get_db)):
    return db.query(ApprovalRule).all()
