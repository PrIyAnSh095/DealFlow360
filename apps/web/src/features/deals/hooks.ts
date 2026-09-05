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
