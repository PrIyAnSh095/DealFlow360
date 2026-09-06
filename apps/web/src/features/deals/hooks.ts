import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealsApi } from './api';
import { DealStatus } from './types';

export function useDeals() {
  return useQuery({
    queryKey: ['deals'],
    queryFn: dealsApi.getDeals,
  });
}

export function useUpdateDealStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string, status: DealStatus }) => 
      dealsApi.updateDealStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useNegotiations() {
  return useQuery({
    queryKey: ['negotiations'],
    queryFn: dealsApi.getNegotiations,
  });
}

export function useRespondNegotiation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, payload }: { messageId: string; payload: { action: string; message?: string; counter_discount_pct?: number } }) =>
      dealsApi.respondToNegotiation(messageId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negotiations'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
}
