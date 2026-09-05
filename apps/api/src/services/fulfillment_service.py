from typing import List, Dict
from sqlalchemy.orm import Session
from src.models.operations import Warehouse, Stock, Order, FulfillmentAllocation
from src.models.quotation import Quotation, QuoteLine
from src.models.product import Product
from src.services.shipping_service import shipping_service

def generate_fulfillment_plans(db: Session, order_id: str) -> Dict[str, List[Dict]]:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return {"plans": []}

    quotation = db.query(Quotation).filter(Quotation.id == order.quotation_id).first()
    if not quotation:
        return {"plans": []}

    warehouses = db.query(Warehouse).all()
    shipping_options = shipping_service.get_shipping_rates()

    # Calculate total revenue and product cost
    total_revenue = quotation.total
    total_product_cost = 0.0
    for line in quotation.lines:
        p = db.query(Product).filter(Product.id == line.product_id).first()
        if p:
            total_product_cost += line.quantity * p.cost

    plans = []
    
    # Plan A: Single Warehouse (Best/Fastest if stock available)
    for wh in warehouses:
        plan_allocations = []
        possible = True
        for line in quotation.lines:
            stock = db.query(Stock).filter(Stock.product_id == line.product_id, Stock.warehouse_id == wh.id).first()
            avail = (stock.quantity_on_hand - stock.quantity_allocated) if stock else 0
            if avail >= line.quantity:
                plan_allocations.append({
                    "quote_line_id": line.id,
                    "product_name": line.product.name if line.product else "Product",
                    "warehouse_id": wh.id,
                    "warehouse_name": wh.name,
                    "quantity": line.quantity
                })
            else:
                possible = False
                break
        
        if possible:
            shipping_cost = shipping_options[0]["rate"] if shipping_options else 150.0
            margin = total_revenue - total_product_cost - shipping_cost
            margin_pct = (margin / total_revenue * 100.0) if total_revenue > 0 else 0.0
            
            plans.append({
                "plan_id": f"plan-single-{wh.id}",
                "name": f"Single Warehouse ({wh.name})",
                "tag": "Recommended",
                "num_shipments": 1,
                "shipping_cost": shipping_cost,
                "eta": shipping_options[0]["eta"] if shipping_options else "2-3 Days",
                "deal_margin": round(margin, 2),
                "margin_percentage": round(margin_pct, 2),
                "allocations": plan_allocations,
                "backorders": []
            })

    # Plan B: Split Warehouse (Lowest Shipping Cost / Distributed)
    split_allocations = []
    split_backorders = []
    for line in quotation.lines:
        needed = line.quantity
        allocated_qty = 0
        for wh in warehouses:
            stock = db.query(Stock).filter(Stock.product_id == line.product_id, Stock.warehouse_id == wh.id).first()
            avail = (stock.quantity_on_hand - stock.quantity_allocated) if stock else 0
            if avail > 0:
                take = min(needed - allocated_qty, avail)
                split_allocations.append({
                    "quote_line_id": line.id,
                    "product_name": line.product.name if line.product else "Product",
                    "warehouse_id": wh.id,
                    "warehouse_name": wh.name,
                    "quantity": take
                })
                allocated_qty += take
                if allocated_qty >= needed:
                    break
        if allocated_qty < needed:
            split_backorders.append({
                "quote_line_id": line.id,
                "product_name": line.product.name if line.product else "Product",
                "quantity": needed - allocated_qty
            })

    shipment_count = len(set(a["warehouse_id"] for a in split_allocations)) or 1
    split_shipping_cost = (shipping_options[1]["rate"] if len(shipping_options) > 1 else 100.0) * shipment_count
    split_margin = total_revenue - total_product_cost - split_shipping_cost
    split_margin_pct = (split_margin / total_revenue * 100.0) if total_revenue > 0 else 0.0

    plans.append({
        "plan_id": "plan-split-multi",
        "name": "Multi-Warehouse Optimized Allocation",
        "tag": "Lowest Shipping Cost" if len(plans) > 0 else "Recommended",
        "num_shipments": shipment_count,
        "shipping_cost": round(split_shipping_cost, 2),
        "eta": shipping_options[1]["eta"] if len(shipping_options) > 1 else "3-5 Days",
        "deal_margin": round(split_margin, 2),
        "margin_percentage": round(split_margin_pct, 2),
        "allocations": split_allocations,
        "backorders": split_backorders
    })

    return {"order_id": order_id, "plans": plans}
