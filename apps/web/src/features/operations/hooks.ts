import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWarehouses, fetchPendingOrders, fetchFulfillmentRecommendation, submitFulfillment } from "./api";
import { FulfillmentAllocationInput } from "./types";

export function useWarehouses() {
  return useQuery({
    queryKey: ["warehouses"],
    queryFn: fetchWarehouses
  });
}

export function usePendingOrders() {
  return useQuery({
    queryKey: ["orders", "pending"],
    queryFn: fetchPendingOrders,
    refetchInterval: 10000,
  });
}

export function useFulfillmentRecommendation(orderId: string | null) {
  return useQuery({
    queryKey: ["fulfillment", "recommend", orderId],
    queryFn: () => fetchFulfillmentRecommendation(orderId!),
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
