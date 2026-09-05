from typing import List, Dict, Any
from sqlalchemy.orm import Session
from src.models.operations import Warehouse, Stock, Order, FulfillmentAllocation, Backorder
from src.models.quotation import Quotation, QuoteLine
from src.models.product import Product
from src.services.shipping_service import shipping_service
from src.services.audit_service import log_audit_event

def generate_fulfillment_plans(db: Session, order_id: str) -> Dict[str, Any]:
    """
    Generates and ranks feasible multi-warehouse fulfillment allocation plans:
    1. Recommended: Best overall balance of margin, shipment count, and ETA.
    2. Lowest Cost: Lowest shipping cost.
    3. Fastest: Shortest delivery ETA.
    4. Fewest Shipments: Minimal warehouse splits.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return {"order_id": order_id, "plans": []}

    quotation = db.query(Quotation).filter(Quotation.id == order.quotation_id).first()
    if not quotation:
        return {"order_id": order_id, "plans": []}

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
    
    # 1. Single Warehouse Plans (Fewest Shipments & Fastest)
    for wh in warehouses:
        plan_allocations = []
        possible = True
        for line in quotation.lines:
            stock = db.query(Stock).filter(Stock.product_id == line.product_id, Stock.warehouse_id == wh.id).first()
            avail = (stock.quantity_on_hand - stock.quantity_allocated) if stock else 0
            if avail >= line.quantity:
                plan_allocations.append({
                    "quote_line_id": line.id,
                    "product_id": line.product_id,
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
                "tag": "Recommended" if len(plans) == 0 else "Fewest Shipments",
                "num_shipments": 1,
                "warehouses_used": [wh.name],
                "shipping_cost": round(shipping_cost, 2),
                "product_cost": round(total_product_cost, 2),
                "total_order_cost": round(total_product_cost + shipping_cost, 2),
                "eta": shipping_options[0]["eta"] if shipping_options else "2 Days",
                "deal_margin": round(margin, 2),
                "margin_percentage": round(margin_pct, 2),
                "allocations": plan_allocations,
                "backorders": []
            })

    # 2. Multi-Warehouse Split Plan (Distributed / Lowest Cost if applicable)
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
                    "product_id": line.product_id,
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
                "product_id": line.product_id,
                "product_name": line.product.name if line.product else "Product",
                "quantity": needed - allocated_qty
            })

    used_wh_ids = list(set(a["warehouse_id"] for a in split_allocations))
    used_wh_names = list(set(a["warehouse_name"] for a in split_allocations))
    shipment_count = len(used_wh_ids) or 1
    split_shipping_cost = (shipping_options[1]["rate"] if len(shipping_options) > 1 else 100.0) * shipment_count
    split_margin = total_revenue - total_product_cost - split_shipping_cost
    split_margin_pct = (split_margin / total_revenue * 100.0) if total_revenue > 0 else 0.0

    plans.append({
        "plan_id": "plan-split-multi",
        "name": "Multi-Warehouse Split Allocation",
        "tag": "Lowest Cost" if len(plans) > 0 else "Recommended",
        "num_shipments": shipment_count,
        "warehouses_used": used_wh_names,
        "shipping_cost": round(split_shipping_cost, 2),
        "product_cost": round(total_product_cost, 2),
        "total_order_cost": round(total_product_cost + split_shipping_cost, 2),
        "eta": shipping_options[1]["eta"] if len(shipping_options) > 1 else "3-5 Days",
        "deal_margin": round(split_margin, 2),
        "margin_percentage": round(split_margin_pct, 2),
        "allocations": split_allocations,
        "backorders": split_backorders
    })

    return {"order_id": order_id, "plans": plans}

def apply_fulfillment_plan(db: Session, order_id: str, plan_data: Dict[str, Any], user_id: str = "system") -> Dict[str, Any]:
    """
    Applies a selected fulfillment allocation plan to an order, updating stock allocations
    and creating backorders if necessary.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return {"error": "Order not found"}

    # Clear existing allocations and backorders for order
    db.query(FulfillmentAllocation).filter(FulfillmentAllocation.order_id == order_id).delete()
    db.query(Backorder).filter(Backorder.order_id == order_id).delete()

    allocations = plan_data.get("allocations", [])
    backorders = plan_data.get("backorders", [])

    created_allocations = []
    for alloc in allocations:
        stock = db.query(Stock).filter(Stock.product_id == alloc["product_id"], Stock.warehouse_id == alloc["warehouse_id"]).first()
        if stock:
            avail = stock.quantity_on_hand - stock.quantity_allocated
            if alloc["quantity"] > avail:
                return {"error": f"Insufficient stock in warehouse {alloc['warehouse_id']} for product {alloc['product_id']}."}
            stock.quantity_allocated += alloc["quantity"]

        fa = FulfillmentAllocation(
            order_id=order_id,
            warehouse_id=alloc["warehouse_id"],
            product_id=alloc["product_id"],
            quantity=alloc["quantity"],
            status="allocated"
        )
        db.add(fa)
        created_allocations.append(fa)

    created_backorders = []
    for bo in backorders:
        b = Backorder(
            order_id=order_id,
            product_id=bo["product_id"],
            quantity=bo["quantity"],
            status="PENDING"
        )
        db.add(b)
        created_backorders.append(b)

    order.status = "shipped" if len(created_backorders) == 0 else "partially_fulfilled"
    db.commit()

    log_audit_event(
        db,
        user_id=user_id,
        action="FULFILLMENT_PLAN_APPLIED",
        entity_type="Order",
        entity_id=order_id,
        details=f"Applied plan with {len(created_allocations)} allocations and {len(created_backorders)} backorders."
    )

    return {"status": "success", "order_status": order.status, "num_allocations": len(created_allocations), "num_backorders": len(created_backorders)}
