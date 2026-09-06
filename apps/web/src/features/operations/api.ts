import { apiClient } from "@/lib/api-client";
import { Warehouse, StockItem, Order, FulfillmentRecommendationResponse, FulfillmentAllocationInput, Backorder, FulfillmentPlansResponse, FulfillmentPlan } from "./types";

export const fetchWarehouses = async (): Promise<Warehouse[]> => {
  const response = await apiClient.get<Warehouse[]>("/operations/warehouses");
  return response.data;
};

export const fetchPendingOrders = async (): Promise<Order[]> => {
  const response = await apiClient.get<Order[]>("/operations/orders");
  return response.data;
};

export const fetchFulfillmentRecommendation = async (orderId: string): Promise<FulfillmentRecommendationResponse> => {
  const response = await apiClient.get<FulfillmentRecommendationResponse>(`/operations/fulfillment/recommend/${orderId}`);
  return response.data;
};

export const fetchFulfillmentPlans = async (orderId: string): Promise<FulfillmentPlansResponse> => {
  const response = await apiClient.get<FulfillmentPlansResponse>(`/operations/fulfillment/plans/${orderId}`);
  return response.data;
};

export const applyFulfillmentPlan = async (orderId: string, plan: FulfillmentPlan): Promise<any> => {
  const response = await apiClient.post(`/operations/fulfillment/apply/${orderId}`, plan);
  return response.data;
};

export const submitFulfillment = async (orderId: string, allocations: FulfillmentAllocationInput[]): Promise<any> => {
  const response = await apiClient.post(`/operations/fulfillment/${orderId}`, { allocations });
  return response.data;
};

export const fetchBackorders = async (): Promise<Backorder[]> => {
  const response = await apiClient.get<Backorder[]>("/operations/backorders");
  return response.data;
};

export const updateOrderStatus = async (
  orderId: string,
  payload: {
    status?: string;
    tracking_number?: string;
    carrier?: string;
    estimated_delivery?: string;
    delivery_notes?: string;
  }
): Promise<Order> => {
  const response = await apiClient.patch<Order>(`/operations/orders/${orderId}/status`, payload);
  return response.data;
};

export const createWarehouse = async (data: Partial<Warehouse>): Promise<Warehouse> => {
  const response = await apiClient.post<Warehouse>("/operations/warehouses", data);
  return response.data;
};

export const updateWarehouse = async (id: string, data: Partial<Warehouse>): Promise<Warehouse> => {
  const response = await apiClient.patch<Warehouse>(`/operations/warehouses/${id}`, data);
  return response.data;
};

export const deleteWarehouse = async (id: string): Promise<void> => {
  await apiClient.delete(`/operations/warehouses/${id}`);
};

export const getWarehouseStock = async (warehouseId: string): Promise<StockItem[]> => {
  const response = await apiClient.get<StockItem[]>(`/operations/warehouses/${warehouseId}/stock`);
  return response.data;
};

export const updateProductStock = async (warehouseId: string, productId: string, payload: { quantity_on_hand: number; reason?: string }): Promise<StockItem> => {
  const response = await apiClient.patch<StockItem>(`/operations/warehouses/${warehouseId}/stock/${productId}`, payload);
  return response.data;
};

export const operationsApi = {
  getWarehouses: fetchWarehouses,
  createWarehouse: createWarehouse,
  updateWarehouse: updateWarehouse,
  deleteWarehouse: deleteWarehouse,
  getWarehouseStock: getWarehouseStock,
  updateProductStock: updateProductStock,
  getOrders: fetchPendingOrders,
  getRecommendations: fetchFulfillmentRecommendation,
  getFulfillmentPlans: fetchFulfillmentPlans,
  applyFulfillmentPlan: applyFulfillmentPlan,
  processFulfillment: submitFulfillment,
  getBackorders: fetchBackorders,
  updateOrderStatus: updateOrderStatus,
};
