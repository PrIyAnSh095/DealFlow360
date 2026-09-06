from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any

from src.core.database import get_db
from src.api.deps import RoleChecker
from src.core.security import get_current_user
from src.models.quotation import Quotation, QuoteLine
from src.models.product import Product
from src.models.deal import Deal
from src.models.user import User
from src.models.operations import Warehouse, Stock, Order, FulfillmentAllocation, Backorder
from src.schemas.operations import (
    OrderResponse, OrderStatusUpdate, WarehouseResponse, WarehouseCreate, WarehouseUpdate,
    FulfillmentRecommendationResponse, FulfillmentRecommendationLine, 
    FulfillmentAllocationInput, FulfillmentRequest, BackorderResponse, WarehouseStockResponse
)
from src.services.fulfillment_service import generate_fulfillment_plans, apply_fulfillment_plan
from src.services.shipping_service import shipping_service
from src.services.ai_service import ai_service
from src.services.audit_service import log_audit_event

router = APIRouter()

from src.models.audit import AuditLog

# --- WAREHOUSES & STOCK ---
@router.get("/warehouses", response_model=List[WarehouseResponse])
def get_warehouses(db: Session = Depends(get_db)):
    return db.query(Warehouse).all()

@router.post("/warehouses", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
def create_warehouse(
    warehouse_in: WarehouseCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(RoleChecker(["admin", "sales_manager", "manager", "finance", "operations"]))
):
    db_warehouse = Warehouse(**warehouse_in.model_dump())
    db.add(db_warehouse)
    db.commit()
    db.refresh(db_warehouse)
    return db_warehouse

@router.patch("/warehouses/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse(
    warehouse_id: str, 
    warehouse_in: WarehouseUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(RoleChecker(["admin", "sales_manager", "manager", "finance", "operations"]))
):
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
def delete_warehouse(
    warehouse_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(RoleChecker(["admin", "sales_manager", "manager", "finance", "operations"]))
):
    db_warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not db_warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
        
    db_warehouse.is_active = False
    db.commit()

@router.get("/warehouses/{warehouse_id}/stock")
def get_warehouse_stock(
    warehouse_id: str,
    db: Session = Depends(get_db)
):
    wh = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not wh:
        raise HTTPException(404, "Warehouse not found")
        
    products = db.query(Product).all()
    stocks = db.query(Stock).filter(Stock.warehouse_id == warehouse_id).all()
    stock_map = {s.product_id: s for s in stocks}
    
    result = []
    for prod in products:
        st = stock_map.get(prod.id)
        qty_on_hand = st.quantity_on_hand if st else 0
        qty_alloc = st.quantity_allocated if st else 0
        avail = max(0, qty_on_hand - qty_alloc)
        
        result.append({
            "id": st.id if st else f"new-{wh.id}-{prod.id}",
            "product_id": prod.id,
            "product_name": prod.name,
            "sku": getattr(prod, 'sku', prod.id[:8]),
            "warehouse_id": wh.id,
            "warehouse_name": wh.name,
            "quantity_on_hand": qty_on_hand,
            "quantity_allocated": qty_alloc,
            "available_quantity": avail
        })
    return result

@router.patch("/warehouses/{warehouse_id}/stock/{product_id}")
def update_product_stock(
    warehouse_id: str,
    product_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "sales_manager", "manager", "finance", "operations"]))
):
    wh = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not wh:
        raise HTTPException(404, "Warehouse not found")
        
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(404, "Product not found")
        
    new_qty = payload.get("quantity_on_hand")
    if new_qty is None or new_qty < 0:
        raise HTTPException(400, "quantity_on_hand must be a non-negative integer.")
        
    reason = payload.get("reason", "Stock adjustment")
    
    stock = db.query(Stock).filter(Stock.warehouse_id == warehouse_id, Stock.product_id == product_id).first()
    old_qty = stock.quantity_on_hand if stock else 0
    
    if stock:
        if new_qty < stock.quantity_allocated:
            raise HTTPException(400, f"Cannot set stock to {new_qty} because {stock.quantity_allocated} units are already allocated.")
        stock.quantity_on_hand = new_qty
    else:
        stock = Stock(
            warehouse_id=warehouse_id,
            product_id=product_id,
            quantity_on_hand=new_qty,
            quantity_allocated=0
        )
        db.add(stock)
        
    diff = new_qty - old_qty
    db.add(AuditLog(
        actor_id=str(current_user.id),
        action="STOCK_ADJUSTED",
        entity_type="STOCK",
        entity_id=f"{warehouse_id}:{product_id}",
        details={
            "warehouse_name": wh.name,
            "product_name": prod.name,
            "previous_quantity": old_qty,
            "new_quantity": new_qty,
            "difference": diff,
            "reason": reason,
            "adjusted_by": current_user.name
        }
    ))
    
    db.commit()
    db.refresh(stock)
    return {
        "id": stock.id,
        "product_id": prod.id,
        "product_name": prod.name,
        "warehouse_id": wh.id,
        "warehouse_name": wh.name,
        "quantity_on_hand": stock.quantity_on_hand,
        "quantity_allocated": stock.quantity_allocated,
        "available_quantity": stock.available_quantity
    }

# --- ORDERS & FULFILLMENT ---
@router.get("/orders", response_model=List[OrderResponse])
def get_pending_orders(db: Session = Depends(get_db)):
    orders = db.query(Order)\
        .options(joinedload(Order.quotation).joinedload(Quotation.deal).joinedload(Deal.customer))\
        .order_by(Order.created_at.desc())\
        .all()
    resp = []
    for order in orders:
        quote = order.quotation
        deal = quote.deal if quote else None
        cust_name = deal.customer_name if (deal and hasattr(deal, 'customer_name') and deal.customer_name) else (deal.customer.name if (deal and hasattr(deal, 'customer') and deal.customer) else "Unknown")
        
        resp.append(OrderResponse(
            id=order.id,
            quotation_id=order.quotation_id,
            status=order.status,
            created_at=order.created_at,
            customer_name=cust_name,
            deal_name=f"Order for {cust_name}",
            tracking_number=getattr(order, 'tracking_number', None),
            carrier=getattr(order, 'carrier', None),
            estimated_delivery=getattr(order, 'estimated_delivery', None),
            delivery_notes=getattr(order, 'delivery_notes', None)
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
            deal_name=f"Order for {cust_name}",
            tracking_number=getattr(existing_order, 'tracking_number', None),
            carrier=getattr(existing_order, 'carrier', None),
            estimated_delivery=getattr(existing_order, 'estimated_delivery', None),
            delivery_notes=getattr(existing_order, 'delivery_notes', None)
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
        deal_name=f"Order for {cust_name}",
        tracking_number=getattr(order, 'tracking_number', None),
        carrier=getattr(order, 'carrier', None),
        estimated_delivery=getattr(order, 'estimated_delivery', None),
        delivery_notes=getattr(order, 'delivery_notes', None)
    )

@router.patch("/orders/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: str,
    update_data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Updates order/delivery status, tracking number, carrier, and ETA in database."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    user_id = current_user.get("sub") if isinstance(current_user, dict) else getattr(current_user, "id", None)
    user_role = (current_user.get("role") if isinstance(current_user, dict) else getattr(current_user, "role", "")).lower()

    quote = db.query(Quotation).filter(Quotation.id == order.quotation_id).first()
    deal = db.query(Deal).filter(Deal.id == quote.deal_id).first() if quote else None

    # Security IDOR Ownership Check for Sales Rep
    if user_role == "sales_rep" and deal:
        is_owner = (deal.owner_id == user_id) if deal.owner_id else False
        is_cust_rep = (deal.customer.assigned_sales_rep_id == user_id) if (deal.customer and getattr(deal.customer, "assigned_sales_rep_id", None)) else False
        if not is_owner and not is_cust_rep and deal.owner_id is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You are not authorized to update order delivery status for another Sales Rep's deal."
            )
        
    if update_data.status:
        order.status = update_data.status
    if update_data.tracking_number is not None:
        order.tracking_number = update_data.tracking_number
    if update_data.carrier is not None:
        order.carrier = update_data.carrier
    if update_data.estimated_delivery is not None:
        order.estimated_delivery = update_data.estimated_delivery
    if update_data.delivery_notes is not None:
        order.delivery_notes = update_data.delivery_notes

    db.commit()
    db.refresh(order)

    quote = db.query(Quotation).filter(Quotation.id == order.quotation_id).first()
    deal = db.query(Deal).filter(Deal.id == quote.deal_id).first() if quote else None
    cust_name = deal.customer_name if (deal and hasattr(deal, 'customer_name') and deal.customer_name) else (deal.customer.name if (deal and hasattr(deal, 'customer') and deal.customer) else "Unknown")

    user_id = current_user.get("sub", "system") if isinstance(current_user, dict) else getattr(current_user, "id", "system")
    log_audit_event(
        db,
        user_id=user_id,
        action="ORDER_STATUS_UPDATED",
        entity_type="Order",
        entity_id=order_id,
        details=f"Updated status to {order.status}, tracking: {order.tracking_number}, carrier: {order.carrier}"
    )

    return OrderResponse(
        id=order.id,
        quotation_id=order.quotation_id,
        status=order.status,
        created_at=order.created_at,
        customer_name=cust_name,
        deal_name=f"Order for {cust_name}",
        tracking_number=getattr(order, 'tracking_number', None),
        carrier=getattr(order, 'carrier', None),
        estimated_delivery=getattr(order, 'estimated_delivery', None),
        delivery_notes=getattr(order, 'delivery_notes', None)
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

@router.get("/backorders", response_model=List[BackorderResponse])
def get_backorders(db: Session = Depends(get_db)):
    backorders = db.query(Backorder)\
        .options(
            joinedload(Backorder.order).joinedload(Order.quotation).joinedload(Quotation.deal).joinedload(Deal.customer),
            joinedload(Backorder.product)
        )\
        .filter(Backorder.status != "FULFILLED")\
        .all()
    
    all_stocks = db.query(Stock).options(joinedload(Stock.warehouse)).all()
    stock_by_product: Dict[str, List[Stock]] = {}
    for s in all_stocks:
        stock_by_product.setdefault(s.product_id, []).append(s)
        
    all_quote_lines = db.query(QuoteLine).all()
    quote_line_map: Dict[tuple, QuoteLine] = {(ql.quotation_id, ql.product_id): ql for ql in all_quote_lines}

    resp = []
    for b in backorders:
        order = b.order
        product = b.product
        quote = order.quotation if order else None
        deal = quote.deal if quote else None
        
        cust_name = "Unknown"
        if deal:
            if hasattr(deal, 'customer_name') and deal.customer_name:
                cust_name = deal.customer_name
            elif hasattr(deal, 'customer') and deal.customer:
                cust_name = getattr(deal.customer, 'name', getattr(deal.customer, 'company', 'Unknown'))
                
        stocks = stock_by_product.get(b.product_id, [])
        wh_stock_list = []
        for s in stocks:
            wh = s.warehouse
            if wh:
                wh_stock_list.append(WarehouseStockResponse(
                    name=wh.name,
                    location=wh.location,
                    available=max(0, s.quantity_on_hand - s.quantity_allocated)
                ))
        
        val = 0.0
        if product:
            val = float(product.sales_price or 0.0) * b.quantity
            
        pending = b.quantity
        ordered = pending
        shipped = 0
        
        quote_line = quote_line_map.get((quote.id, b.product_id)) if quote else None
        if quote_line:
            ordered = quote_line.quantity
            shipped = max(0, ordered - pending)

        resp.append(BackorderResponse(
            id=b.id,
            orderId=b.order_id,
            customer=cust_name,
            product=product.name if product else "Unknown",
            sku=product.sku if product else "UNK",
            ordered=ordered,
            shipped=shipped,
            pending=pending,
            status="waiting" if b.status == "PENDING" else b.status.lower(),
            orderDate=b.created_at.isoformat() if b.created_at else "",
            eta=None,
            valueAtRisk=val,
            warehouses=wh_stock_list
        ))
    return resp
