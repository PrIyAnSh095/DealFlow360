import { Order, Warehouse, FulfillmentRecommendationResponse, FulfillmentAllocationInput } from "./types";
import { apiClient } from "@/lib/api-client";

export async function fetchWarehouses(): Promise<Warehouse[]> {
  const res = await apiClient.get<Warehouse[]>('/operations/warehouses');
  return res.data;
}

export async function fetchPendingOrders(): Promise<Order[]> {
  const res = await apiClient.get<Order[]>('/operations/orders');
  return res.data;
}

export async function fetchFulfillmentRecommendation(orderId: string): Promise<FulfillmentRecommendationResponse> {
  const res = await apiClient.get<FulfillmentRecommendationResponse>(`/operations/fulfillment/recommend/${orderId}`);
  return res.data;
}

export async function submitFulfillment(orderId: string, allocations: FulfillmentAllocationInput[]): Promise<void> {
  await apiClient.post(`/operations/fulfillment/${orderId}`, { allocations });
}
