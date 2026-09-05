from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Optional
from src.core.database import get_db
from src.models.operations import Warehouse, Stock, Order, FulfillmentAllocation
from src.models.quotation import Quotation
from src.models.deal import Deal
from src.models.product import Product
from src.services.inventory_service import get_product_stock_across_warehouses, allocate_stock_for_order
from src.services.fulfillment_service import generate_fulfillment_plans
from src.services.shipping_service import shipping_service

router = APIRouter()

class AllocateStockInput(BaseModel):
    allocations: Dict[str, Dict[str, int]] # {quote_line_id: {warehouse_id: qty}}

@router.get("/warehouses")
def list_warehouses(db: Session = Depends(get_db)):
    return db.query(Warehouse).all()

@router.get("/stock")
def get_stock(db: Session = Depends(get_db)):
    stocks = db.query(Stock).all()
    results = []
    for s in stocks:
        wh = db.query(Warehouse).filter(Warehouse.id == s.warehouse_id).first()
        p = db.query(Product).filter(Product.id == s.product_id).first()
        results.append({
            "id": s.id,
            "product_id": s.product_id,
            "product_name": p.name if p else "Product",
            "warehouse_id": s.warehouse_id,
            "warehouse_name": wh.name if wh else "Warehouse",
            "quantity_on_hand": s.quantity_on_hand,
            "quantity_allocated": s.quantity_allocated,
            "available": max(s.quantity_on_hand - s.quantity_allocated, 0)
        })
    return results

@router.get("/orders")
def list_fulfillment_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).all()
    results = []
    for o in orders:
        q = db.query(Quotation).filter(Quotation.id == o.quotation_id).first()
        deal = db.query(Deal).filter(Deal.id == q.deal_id).first() if q else None
        results.append({
            "id": o.id,
            "quotation_id": o.quotation_id,
            "customer_name": deal.customer_name if deal else "Unknown",
            "deal_value": q.total if q else 0.0,
            "status": o.status,
            "created_at": o.created_at
        })
    return results

@router.get("/fulfillment/{order_id}/plans")
def get_order_fulfillment_plans(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return generate_fulfillment_plans(db, order_id)

@router.post("/fulfillment/{order_id}/allocate")
def allocate_order(order_id: str, payload: AllocateStockInput, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    q = db.query(Quotation).filter(Quotation.id == order.quotation_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")

    all_allocations = []
    total_backorders = 0

    for line in q.lines:
        wh_allocs = payload.allocations.get(line.id, {})
        allocs, bo_qty = allocate_stock_for_order(
            db=db,
            order_id=order_id,
            quote_line_id=line.id,
            product_id=line.product_id,
            requested_qty=line.quantity,
            warehouse_allocations=wh_allocs
        )
        all_allocations.extend(allocs)
        total_backorders += bo_qty

    order.status = "fulfilled" if total_backorders == 0 else "partially_fulfilled_backorder"
    db.commit()

    return {
        "order_id": order_id,
        "status": order.status,
        "allocations_count": len(all_allocations),
        "backorders_count": total_backorders,
        "message": "Stock allocated successfully"
    }

@router.get("/shipping-rates")
def get_shipping_rates(pickup_pincode: str = "110001", delivery_pincode: str = "400001", weight_kg: float = 5.0):
    rates = shipping_service.get_shipping_rates(pickup_pincode, delivery_pincode, weight_kg)
    return {"rates": rates}
