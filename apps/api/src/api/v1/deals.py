from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from typing import List
from decimal import Decimal
from src.api.deps import DEAL_VIEW_ROLES, DEAL_WRITE_ROLES, get_db, RoleChecker
from src.models.user import User
from src.models.deal import Deal
from src.models.customer import Customer
from src.models.quotation import Quotation, QuoteLine
from src.models.product import Product
from src.services.pricing_service import recalculate_quotation
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
    deals_query = db.query(Deal).options(joinedload(Deal.customer))
    if current_user.role == "sales_rep":
        deals_query = deals_query.outerjoin(Customer).filter(
            or_(
                Deal.owner_id == current_user.id,
                Customer.assigned_sales_rep_id == current_user.id,
            )
        )
    deals = deals_query.order_by(Deal.created_at.desc()).all()
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

from src.services.audit_service import log_audit_event

ALLOWED_TRANSITIONS = {
    "draft": ["review", "approval", "negotiation", "lost", "won"],
    "lead": ["draft", "review", "approval", "negotiation", "lost", "won"],
    "review": ["draft", "approval", "negotiation", "lost", "won"],
    "qualification": ["draft", "review", "approval", "negotiation", "lost", "won"],
    "approval": ["negotiation", "lost", "draft"],
    "negotiation": ["won", "confirmed", "lost", "approval", "draft"],
    "won": ["confirmed", "completed"],
    "confirmed": ["completed", "fulfillment"],
    "lost": ["draft"]
}
KANBAN_STATUSES = {"draft", "review", "approval", "negotiation", "won", "lost"}

@router.post("/", response_model=DealResponse, status_code=status.HTTP_201_CREATED)
def create_deal(
    deal_in: DealCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(DEAL_WRITE_ROLES))
):
    """
    Create a new deal with an initial quotation in an atomic transaction.
    """
    cust_name = deal_in.customer_name
    if deal_in.customer_id:
        customer = db.query(Customer).filter(Customer.id == deal_in.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        cust_name = customer.name
        # If customer has assigned sales rep, use it if needed
        if not getattr(customer, "assigned_sales_rep_id", None) and current_user.role == "sales_rep":
            customer.assigned_sales_rep_id = current_user.id

    deal_data = deal_in.model_dump(exclude={"initial_quotation"})
    deal_data["customer_name"] = cust_name
    deal_data["owner_id"] = current_user.id

    try:
        new_deal = Deal(**deal_data)
        db.add(new_deal)
        db.flush()

        # 1. Create initial Quotation for the deal
        quotation = Quotation(
            deal_id=new_deal.id,
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

        # 2. Add Quotation Lines (either provided or from default product)
        has_lines = False
        if deal_in.initial_quotation and deal_in.initial_quotation.lines:
            for line_in in deal_in.initial_quotation.lines:
                prod = db.query(Product).filter(Product.id == line_in.product_id).first()
                if prod:
                    q_line = QuoteLine(
                        quotation_id=quotation.id,
                        product_id=prod.id,
                        quantity=line_in.quantity,
                        unit_price=prod.sales_price,
                        discount_percent=float(line_in.discount_percent)
                    )
                    db.add(q_line)
                    has_lines = True

        if not has_lines:
            default_product = db.query(Product).first()
            if not default_product:
                raise HTTPException(
                    status_code=400, 
                    detail="Cannot create deal/quotation: No products exist in system."
                )
            q_line = QuoteLine(
                quotation_id=quotation.id,
                product_id=default_product.id,
                quantity=1,
                unit_price=default_product.sales_price,
                discount_percent=0.0
            )
            db.add(q_line)

        db.flush()

        # 3. Recalculate quotation metrics and update deal value & risk
        updated_q = recalculate_quotation(db, quotation)
        if deal_in.value == Decimal('0.00') or deal_in.value is None:
            new_deal.value = updated_q.total
        new_deal.risk = updated_q.risk_score

        # 4. Commit transaction
        db.commit()
        db.refresh(new_deal)

        log_audit_event(
            db=db,
            user_id=current_user.id,
            action="DEAL_CREATED",
            entity_type="Deal",
            entity_id=new_deal.id,
            details=f"Deal created with initial quote {quotation.id}"
        )

        return new_deal
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to create deal and initial quotation: {str(e)}")

@router.patch("/{deal_id}", response_model=DealResponse)
def update_deal(
    deal_id: str,
    deal_in: DealUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(DEAL_WRITE_ROLES))
):
    """
    Update deal with Sales Rep ownership check and state-machine validation.
    """
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    # Security IDOR Check: Sales Rep can only update deals owned by them or assigned customers
    if current_user.role == "sales_rep":
        is_owner = deal.owner_id == current_user.id if deal.owner_id else False
        is_cust_rep = deal.customer.assigned_sales_rep_id == current_user.id if (deal.customer and getattr(deal.customer, "assigned_sales_rep_id", None)) else False
        if not is_owner and not is_cust_rep:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You are not authorized to update deals assigned to another Sales Rep."
            )

    update_data = deal_in.model_dump(exclude_unset=True)

    # State Machine Validation
    if "status" in update_data and update_data["status"]:
        current_status = (deal.status or "draft").lower()
        target_status = update_data["status"].lower()
        
        if current_status != target_status:
            allowed = ALLOWED_TRANSITIONS.get(current_status, list(KANBAN_STATUSES))
            kanban_move = current_status in KANBAN_STATUSES and target_status in KANBAN_STATUSES
            if target_status not in allowed and not kanban_move:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid deal status transition from '{deal.status}' to '{update_data['status']}'."
                )

    old_status = deal.status
    for field, value in update_data.items():
        setattr(deal, field, value)
        
    db.commit()
    db.refresh(deal)

    if "status" in update_data and old_status != deal.status:
        log_audit_event(
            db=db,
            user_id=current_user.id,
            action="DEAL_STATUS_UPDATED",
            entity_type="Deal",
            entity_id=deal.id,
            details=f"Status changed from {old_status} to {deal.status}"
        )

    return deal
