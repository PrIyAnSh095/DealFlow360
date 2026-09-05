import { useQuery, useMutation } from '@tanstack/react-query';
import { quotationsApi } from './api';
import { QuoteRecalculateRequest } from './types';

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: quotationsApi.getProducts,
  });
};

export const useRecalculateQuote = () => {
  return useMutation({
    mutationFn: ({ quotationId, request }: { quotationId: string; request: QuoteRecalculateRequest }) =>
      quotationsApi.recalculate(quotationId, request),
  });
};
