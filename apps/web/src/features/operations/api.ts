import { Order, Warehouse, FulfillmentRecommendationResponse, FulfillmentAllocationInput } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchWarehouses(): Promise<Warehouse[]> {
  const res = await fetch(`${API_BASE}/operations/warehouses`);
  if (!res.ok) throw new Error("Failed to fetch warehouses");
  return res.json();
}

export async function fetchPendingOrders(): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/operations/orders`);
  if (!res.ok) throw new Error("Failed to fetch pending orders");
  const data = await res.json();
  return (data || []).map((item: any) => ({
    id: item.id,
    quotation_id: item.quotation_id,
    status: item.status || "pending_fulfillment",
    created_at: item.created_at,
    customer_name: item.customer_name || "Customer",
    deal_name: item.deal_name || `Order #${item.id.split('-')[0]}`
  }));
}

export async function fetchFulfillmentRecommendation(orderId: string): Promise<FulfillmentRecommendationResponse> {
  const res = await fetch(`${API_BASE}/operations/fulfillment/${orderId}/plans`);
  if (!res.ok) throw new Error("Failed to fetch recommendation");
  const data = await res.json();
  const plans = data.plans || [];
  const primaryPlan = plans[0] || {};
  const allocations = primaryPlan.allocations || [];

  return {
    order_id: orderId,
    lines: allocations.map((a: any) => ({
      quote_line_id: a.quote_line_id,
      product_name: a.product_name || "Product",
      requested_quantity: a.quantity,
      recommended_allocations: [
        {
          quote_line_id: a.quote_line_id,
          warehouse_id: a.warehouse_id,
          quantity: a.quantity
        }
      ]
    }))
  };
}

export async function submitFulfillment(orderId: string, allocations: FulfillmentAllocationInput[]): Promise<void> {
  const allocationMap: Record<string, Record<string, number>> = {};
  allocations.forEach(a => {
    if (a.warehouse_id) {
      const whId = a.warehouse_id;
      allocationMap[a.quote_line_id] = allocationMap[a.quote_line_id] || {};
      allocationMap[a.quote_line_id][whId] = a.quantity;
    }
  });

  const res = await fetch(`${API_BASE}/operations/fulfillment/${orderId}/allocate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ allocations: allocationMap })
  });
  if (!res.ok) throw new Error("Failed to submit fulfillment");
}
