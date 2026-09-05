import { Order, Warehouse, FulfillmentRecommendationResponse, FulfillmentAllocationInput } from "./types";

const API_BASE = "http://localhost:8000/api/v1";

export async function fetchWarehouses(): Promise<Warehouse[]> {
  const res = await fetch(`${API_BASE}/operations/warehouses`);
  if (!res.ok) throw new Error("Failed to fetch warehouses");
  return res.json();
}

export async function fetchPendingOrders(): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/operations/orders`);
  if (!res.ok) throw new Error("Failed to fetch pending orders");
  return res.json();
}

export async function fetchFulfillmentRecommendation(orderId: string): Promise<FulfillmentRecommendationResponse> {
  const res = await fetch(`${API_BASE}/operations/fulfillment/recommend/${orderId}`);
  if (!res.ok) throw new Error("Failed to fetch recommendation");
  return res.json();
}

export async function submitFulfillment(orderId: string, allocations: FulfillmentAllocationInput[]): Promise<void> {
  const res = await fetch(`${API_BASE}/operations/fulfillment/${orderId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ allocations })
  });
  if (!res.ok) throw new Error("Failed to submit fulfillment");
}
