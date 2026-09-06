import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWarehouses, fetchPendingOrders, fetchFulfillmentRecommendation, submitFulfillment, fetchBackorders, operationsApi } from "./api";
import { FulfillmentAllocationInput, Warehouse, Order, FulfillmentRecommendationResponse, Backorder } from "./types";

export function useWarehouses() {
  return useQuery<Warehouse[]>({
    queryKey: ["warehouses"],
    queryFn: fetchWarehouses
  });
}

export function usePendingOrders() {
  return useQuery<Order[]>({
    queryKey: ["orders", "pending"],
    queryFn: fetchPendingOrders,
    refetchInterval: 10000,
  });
}

export function useFulfillmentRecommendation(orderId: string | null) {
  return useQuery<FulfillmentRecommendationResponse | null>({
    queryKey: ["fulfillment", "recommend", orderId],
    queryFn: () => orderId ? fetchFulfillmentRecommendation(orderId) : Promise.resolve(null),
    enabled: !!orderId
  });
}

export function useSubmitFulfillment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, allocations }: { orderId: string; allocations: FulfillmentAllocationInput[] }) => 
      submitFulfillment(orderId, allocations),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", "pending"] });
    }
  });
}

export function useWarehouseStock(warehouseId: string | null) {
  return useQuery({
    queryKey: ["stock", warehouseId],
    queryFn: () => warehouseId ? operationsApi.getWarehouseStock(warehouseId) : Promise.resolve([]),
    enabled: !!warehouseId
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Warehouse>) => operationsApi.createWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["fulfillment"] });
      queryClient.invalidateQueries({ queryKey: ["backorders"] });
    }
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Warehouse> }) => operationsApi.updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["fulfillment"] });
      queryClient.invalidateQueries({ queryKey: ["backorders"] });
    }
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => operationsApi.deleteWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["fulfillment"] });
      queryClient.invalidateQueries({ queryKey: ["backorders"] });
    }
  });
}

export function useUpdateStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ warehouseId, productId, quantity_on_hand, reason }: { warehouseId: string; productId: string; quantity_on_hand: number; reason?: string }) =>
      operationsApi.updateProductStock(warehouseId, productId, { quantity_on_hand, reason }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["stock", vars.warehouseId] });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["fulfillment"] });
      queryClient.invalidateQueries({ queryKey: ["backorders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

export function useBackorders() {
  return useQuery<Backorder[]>({
    queryKey: ["backorders"],
    queryFn: fetchBackorders
  });
}
