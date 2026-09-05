from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from src.api.deps import DEAL_VIEW_ROLES, DEAL_WRITE_ROLES, get_db, RoleChecker
from src.models.user import User
from src.models.deal import Deal
from src.models.customer import Customer
from src.schemas.deal import DealResponse, DealCreate, DealUpdate

router = APIRouter()

@router.get("/", response_model=List[DealResponse])
def get_deals(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(DEAL_VIEW_ROLES))
):
    """
    Get all deals accessible by the current user.
    """
    # For now, sales reps see all deals (or we could filter by owner if owner_id existed)
    deals = db.query(Deal).all()
    return deals

@router.get("/{deal_id}", response_model=DealResponse)
def get_deal(
    deal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(DEAL_VIEW_ROLES))
):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return deal

@router.post("/", response_model=DealResponse, status_code=status.HTTP_201_CREATED)
def create_deal(
    deal_in: DealCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(DEAL_WRITE_ROLES))
):
    """
    Create a new deal.
    """
    customer = db.query(Customer).filter(Customer.id == deal_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    new_deal = Deal(**deal_in.model_dump())
    db.add(new_deal)
    db.commit()
    db.refresh(new_deal)
    return new_deal

@router.patch("/{deal_id}", response_model=DealResponse)
def update_deal(
    deal_id: str,
    deal_in: DealUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(DEAL_WRITE_ROLES))
):
    """
    Update deal (e.g. status transition).
    """
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
        
    update_data = deal_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(deal, field, value)
        
    db.commit()
    db.refresh(deal)
    return deal
