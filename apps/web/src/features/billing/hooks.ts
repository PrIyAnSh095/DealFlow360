import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from './api';

export const useInvoices = () => {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: billingApi.getInvoices,
  });
};

export const usePayInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, method }: { id: string, amount: number, method: string }) => 
      billingApi.payInvoice(id, amount, method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

export const useSubscriptions = () => {
  return useQuery({
    queryKey: ['subscriptions'],
    queryFn: billingApi.getSubscriptions,
  });
};

export const useModifySubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string, quantity: number }) => 
      billingApi.modifySubscription(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] }); // might generate proration invoice
    },
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => billingApi.cancelSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
};
