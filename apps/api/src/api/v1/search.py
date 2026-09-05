from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from typing import List
from src.api.deps import SEARCH_ROLES, get_db, RoleChecker
from src.models.user import User
from src.models.deal import Deal
from src.models.customer import Customer
from src.models.quotation import Quotation

router = APIRouter()

class SearchResult(BaseModel):
    id: str
    type: str
    title: str
    subtitle: str
    url: str

@router.get("/", response_model=List[SearchResult])
def search_global(
    q: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(SEARCH_ROLES))
):
    if not q or len(q) < 2:
        return []
        
    results = []
    query = f"%{q}%"
    
    # Search Deals
    deals = db.query(Deal).filter(
        or_(Deal.id.ilike(query))
    ).limit(3).all()
    
    for d in deals:
        results.append(SearchResult(
            id=d.id,
            type="Deal",
            title=f"Deal {d.id[:8]}",
            subtitle=d.status.capitalize(),
            url=f"/deals/{d.id}"
        ))
        
    # Search Customers
    customers = db.query(Customer).filter(
        or_(Customer.name.ilike(query), Customer.company.ilike(query))
    ).limit(3).all()
    
    for c in customers:
        results.append(SearchResult(
            id=c.id,
            type="Customer",
            title=c.name,
            subtitle=c.company,
            url=f"/deals" # For now, no dedicated customer page
        ))
        
    # Search Quotations
    quotes = db.query(Quotation).filter(
        or_(Quotation.id.ilike(query))
    ).limit(3).all()
    
    for qt in quotes:
        results.append(SearchResult(
            id=qt.id,
            type="Quotation",
            title=f"QT-{qt.id[:8]}",
            subtitle=qt.status.capitalize(),
            url=f"/quotations/{qt.id}"
        ))
        
    return results
