from typing import List, Dict, Tuple
from sqlalchemy.orm import Session
from src.models.operations import Warehouse, Stock, Order, FulfillmentAllocation
from src.models.product import Product

def get_product_stock_across_warehouses(db: Session, product_id: str) -> List[Dict]:
    stocks = db.query(Stock).filter(Stock.product_id == product_id).all()
    results = []
    for s in stocks:
        wh = db.query(Warehouse).filter(Warehouse.id == s.warehouse_id).first()
        available = s.quantity_on_hand - s.quantity_allocated
        results.append({
            "warehouse_id": s.warehouse_id,
            "warehouse_name": wh.name if wh else "Unknown",
            "quantity_on_hand": s.quantity_on_hand,
            "quantity_allocated": s.quantity_allocated,
            "available": max(available, 0)
        })
    return results

def allocate_stock_for_order(
    db: Session,
    order_id: str,
    quote_line_id: str,
    product_id: str,
    requested_qty: int,
    warehouse_allocations: Dict[str, int] # e.g. {"w-1": 6, "w-2": 4}
) -> Tuple[List[FulfillmentAllocation], int]:
    """
    Allocates requested stock from specified warehouses.
    Returns (created_allocations, backorder_quantity).
    """
    total_allocated = sum(warehouse_allocations.values())
    backorder_qty = max(requested_qty - total_allocated, 0)
    allocations = []

    for wh_id, qty in warehouse_allocations.items():
        if qty <= 0:
            continue
            
        stock = db.query(Stock).filter(
            Stock.product_id == product_id,
            Stock.warehouse_id == wh_id
        ).first()
        
        if stock:
            stock.quantity_allocated += qty
            
        alloc = FulfillmentAllocation(
            order_id=order_id,
            quote_line_id=quote_line_id,
            warehouse_id=wh_id,
            quantity=qty
        )
        db.add(alloc)
        allocations.append(alloc)

    if backorder_qty > 0:
        backorder_alloc = FulfillmentAllocation(
            order_id=order_id,
            quote_line_id=quote_line_id,
            warehouse_id=None,
            quantity=backorder_qty
        )
        db.add(backorder_alloc)
        allocations.append(backorder_alloc)

    db.commit()
    return allocations, backorder_qty
