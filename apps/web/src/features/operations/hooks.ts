import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWarehouses, fetchPendingOrders, fetchFulfillmentRecommendation, submitFulfillment } from "./api";
import { FulfillmentAllocationInput, Warehouse, Order, FulfillmentRecommendationResponse } from "./types";

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
