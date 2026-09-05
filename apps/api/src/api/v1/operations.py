from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from src.core.database import get_db
from src.models.quotation import Quotation, QuoteLine
from src.models.product import Product
from src.models.deal import Deal
from src.models.operations import Warehouse, Stock, Order, FulfillmentAllocation
from src.schemas.operations import (
    OrderResponse, WarehouseResponse, 
    FulfillmentRecommendationResponse, FulfillmentRecommendationLine, 
    FulfillmentAllocationInput, FulfillmentRequest
)

router = APIRouter()

@router.get("/warehouses", response_model=List[WarehouseResponse])
def get_warehouses(db: Session = Depends(get_db)):
    return db.query(Warehouse).all()

@router.get("/orders", response_model=List[OrderResponse])
def get_pending_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.status == "pending_fulfillment").all()
    resp = []
    for order in orders:
        quote = db.query(Quotation).filter(Quotation.id == order.quotation_id).first()
        deal = db.query(Deal).filter(Deal.id == quote.deal_id).first() if quote else None
        
        resp.append(OrderResponse(
            id=order.id,
            quotation_id=order.quotation_id,
            status=order.status,
            created_at=order.created_at,
            customer_name=deal.customer_name if deal else "Unknown",
            deal_name=f"Order for {deal.customer_name}" if deal else "Unknown"
        ))
    return resp

@router.post("/orders/{quotation_id}", response_model=OrderResponse)
def create_order_from_quote(quotation_id: str, db: Session = Depends(get_db)):
    quote = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quote or quote.status != "ACCEPTED":
        raise HTTPException(400, "Quotation must be ACCEPTED to convert to an order.")
        
    existing_order = db.query(Order).filter(Order.quotation_id == quotation_id).first()
    if existing_order:
        raise HTTPException(400, "Order already exists for this quotation.")
        
    order = Order(quotation_id=quotation_id)
    db.add(order)
    db.commit()
    db.refresh(order)
    
    deal = db.query(Deal).filter(Deal.id == quote.deal_id).first()
    return OrderResponse(
        id=order.id,
        quotation_id=order.quotation_id,
        status=order.status,
        created_at=order.created_at,
        customer_name=deal.customer_name if deal else "Unknown",
        deal_name=f"Order for {deal.customer_name}" if deal else "Unknown"
    )

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
        
        # Simple algorithm: check warehouses in order of most stock
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
                warehouse_id=None, # Backorder
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
            # Deduct stock
            stock = db.query(Stock).filter(
                Stock.product_id == db.query(QuoteLine).filter(QuoteLine.id == alloc.quote_line_id).first().product_id,
                Stock.warehouse_id == alloc.warehouse_id
            ).first()
            if stock:
                stock.quantity_allocated += alloc.quantity
                
    order.status = "fulfilled"
    db.commit()
    return {"message": "Fulfillment processed successfully"}
