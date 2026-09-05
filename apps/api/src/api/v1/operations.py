from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from src.core.database import get_db
from src.api.deps import RoleChecker
from src.core.security import get_current_user
from src.models.quotation import Quotation, QuoteLine
from src.models.product import Product
from src.models.deal import Deal
from src.models.user import User
from src.models.operations import Warehouse, Stock, Order, FulfillmentAllocation
from src.schemas.operations import (
    OrderResponse, WarehouseResponse, WarehouseCreate, WarehouseUpdate,
    FulfillmentRecommendationResponse, FulfillmentRecommendationLine, 
    FulfillmentAllocationInput, FulfillmentRequest
)
from src.services.fulfillment_service import generate_fulfillment_plans, apply_fulfillment_plan
from src.services.shipping_service import shipping_service
from src.services.ai_service import ai_service

router = APIRouter()

# --- WAREHOUSES ---
@router.get("/warehouses", response_model=List[WarehouseResponse])
def get_warehouses(db: Session = Depends(get_db)):
    return db.query(Warehouse).all()

@router.post("/warehouses", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
def create_warehouse(warehouse_in: WarehouseCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_warehouse = Warehouse(**warehouse_in.model_dump())
    db.add(db_warehouse)
    db.commit()
    db.refresh(db_warehouse)
    return db_warehouse

@router.patch("/warehouses/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse(warehouse_id: str, warehouse_in: WarehouseUpdate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not db_warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
        
    update_data = warehouse_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_warehouse, field, value)
        
    db.commit()
    db.refresh(db_warehouse)
    return db_warehouse

@router.delete("/warehouses/{warehouse_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_warehouse(warehouse_id: str, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    db_warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not db_warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
        
    db.delete(db_warehouse)
    db.commit()

# --- ORDERS & FULFILLMENT ---
@router.get("/orders", response_model=List[OrderResponse])
def get_pending_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).all()
    resp = []
    for order in orders:
        quote = db.query(Quotation).filter(Quotation.id == order.quotation_id).first()
        deal = db.query(Deal).filter(Deal.id == quote.deal_id).first() if quote else None
        cust_name = deal.customer_name if (deal and hasattr(deal, 'customer_name') and deal.customer_name) else (deal.customer.name if (deal and hasattr(deal, 'customer') and deal.customer) else "Unknown")
        
        resp.append(OrderResponse(
            id=order.id,
            quotation_id=order.quotation_id,
            status=order.status,
            created_at=order.created_at,
            customer_name=cust_name,
            deal_name=f"Order for {cust_name}"
        ))
    return resp

@router.post("/orders/{quotation_id}", response_model=OrderResponse)
def create_order_from_quote(quotation_id: str, db: Session = Depends(get_db)):
    quote = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quote or quote.status not in ["ACCEPTED", "APPROVED", "CONFIRMED"]:
        raise HTTPException(400, "Quotation must be ACCEPTED or APPROVED to convert to an order.")
        
    existing_order = db.query(Order).filter(Order.quotation_id == quotation_id).first()
    if existing_order:
        deal = db.query(Deal).filter(Deal.id == quote.deal_id).first() if quote else None
        cust_name = deal.customer_name if (deal and hasattr(deal, 'customer_name') and deal.customer_name) else (deal.customer.name if (deal and hasattr(deal, 'customer') and deal.customer) else "Unknown")
        return OrderResponse(
            id=existing_order.id,
            quotation_id=existing_order.quotation_id,
            status=existing_order.status,
            created_at=existing_order.created_at,
            customer_name=cust_name,
            deal_name=f"Order for {cust_name}"
        )
        
    order = Order(quotation_id=quotation_id, status="pending_fulfillment")
    db.add(order)
    db.commit()
    db.refresh(order)
    
    deal = db.query(Deal).filter(Deal.id == quote.deal_id).first() if quote else None
    cust_name = deal.customer_name if (deal and hasattr(deal, 'customer_name') and deal.customer_name) else (deal.customer.name if (deal and hasattr(deal, 'customer') and deal.customer) else "Unknown")
    return OrderResponse(
        id=order.id,
        quotation_id=order.quotation_id,
        status=order.status,
        created_at=order.created_at,
        customer_name=cust_name,
        deal_name=f"Order for {cust_name}"
    )

@router.get("/fulfillment/plans/{order_id}")
def get_ranked_fulfillment_plans(order_id: str, db: Session = Depends(get_db)):
    """Generates ranked fulfillment allocation plans (Recommended, Lowest Cost, Fastest, Fewest Shipments)."""
    return generate_fulfillment_plans(db, order_id)

@router.post("/fulfillment/apply/{order_id}")
def apply_fulfillment_plan_endpoint(order_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Applies a selected fulfillment plan to an order."""
    result = apply_fulfillment_plan(db, order_id, payload)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.get("/shipping/rates")
def calculate_shipping_rates(
    pickup_pincode: str = Query("110001"),
    delivery_pincode: str = Query("400001"),
    weight_kg: float = Query(5.0)
):
    """Calculates shipping rates using backend Shiprocket adapter or internal rate card fallback."""
    return shipping_service.get_shipping_rates(pickup_pincode, delivery_pincode, weight_kg)

@router.post("/fulfillment/{order_id}/ai-explanation")
def get_warehouse_ai_explanation(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Returns local Ollama advisory AI recommendations comparing warehouse fulfillment plans."""
    role = current_user.get("role", "").lower() if isinstance(current_user, dict) else getattr(current_user, "role", "").lower()
    if role in ["customer", "client"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role 'customer' is not authorized to access warehouse AI explanations."
        )

    context = ai_service.build_warehouse_ai_context(db, order_id)
    return ai_service.generate_warehouse_explanation(context, role=role)

@router.post("/ai/explain")
def get_ai_explanation(context: Dict[str, Any]):
    """Returns local Ollama advisory AI recommendations based on structured backend facts context."""
    return ai_service.generate_explanation(context)

@router.get("/fulfillment/recommend/{order_id}", response_model=FulfillmentRecommendationResponse)
def recommend_fulfillment(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
        
    lines = db.query(QuoteLine).filter(QuoteLine.quotation_id == order.quotation_id).all()
    recommended_lines = []
    
    for line in lines:
        product = db.query(Product).filter(Product.id == line.product_id).first()
        qty_needed = line.quantity
        
        stocks = db.query(Stock).filter(Stock.product_id == line.product_id).order_by(Stock.quantity_on_hand.desc()).all()
        allocations = []
        remaining = qty_needed
        
        for stock in stocks:
            if remaining <= 0:
                break
            available = stock.quantity_on_hand - stock.quantity_allocated
            if available > 0:
                take = min(available, remaining)
                allocations.append(FulfillmentAllocationInput(
                    quote_line_id=line.id,
                    warehouse_id=stock.warehouse_id,
                    quantity=take
                ))
                remaining -= take
                
        if remaining > 0:
            allocations.append(FulfillmentAllocationInput(
                quote_line_id=line.id,
                warehouse_id=None,
                quantity=remaining
            ))
            
        recommended_lines.append(FulfillmentRecommendationLine(
            quote_line_id=line.id,
            product_name=product.name if product else "Unknown",
            requested_quantity=qty_needed,
            recommended_allocations=allocations
        ))
        
    return FulfillmentRecommendationResponse(
        order_id=order_id,
        lines=recommended_lines
    )

@router.post("/fulfillment/{order_id}")
def process_fulfillment(order_id: str, payload: FulfillmentRequest, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
        
    for alloc in payload.allocations:
        db_alloc = FulfillmentAllocation(
            order_id=order_id,
            quote_line_id=alloc.quote_line_id,
            warehouse_id=alloc.warehouse_id,
            quantity=alloc.quantity
        )
        db.add(db_alloc)
        
        if alloc.warehouse_id:
            quote_line = db.query(QuoteLine).filter(QuoteLine.id == alloc.quote_line_id).first()
            if quote_line:
                stock = db.query(Stock).filter(
                    Stock.product_id == quote_line.product_id,
                    Stock.warehouse_id == alloc.warehouse_id
                ).first()
                if stock:
                    stock.quantity_allocated += alloc.quantity
                
    order.status = "fulfilled"
    db.commit()
    return {"message": "Fulfillment processed successfully"}
