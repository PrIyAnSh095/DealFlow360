import { apiClient } from "@/lib/api-client";
import { Warehouse, Order, FulfillmentRecommendationResponse, FulfillmentAllocationInput, Backorder } from "./types";

export const fetchWarehouses = async (): Promise<Warehouse[]> => {
  return apiClient.get("/operations/warehouses");
};

export const fetchPendingOrders = async (): Promise<Order[]> => {
  return apiClient.get("/operations/orders");
};

export const fetchFulfillmentRecommendation = async (orderId: string): Promise<FulfillmentRecommendationResponse> => {
  return apiClient.get(`/operations/fulfillment/recommend/${orderId}`);
};

export const submitFulfillment = async (orderId: string, allocations: FulfillmentAllocationInput[]): Promise<any> => {
  return apiClient.post(`/operations/fulfillment/${orderId}`, { allocations });
};

export const fetchBackorders = async (): Promise<Backorder[]> => {
  return apiClient.get("/operations/backorders");
};

export const operationsApi = {
  getWarehouses: fetchWarehouses,
  getOrders: fetchPendingOrders,
  getRecommendations: fetchFulfillmentRecommendation,
  processFulfillment: submitFulfillment,
  getBackorders: fetchBackorders,
};
