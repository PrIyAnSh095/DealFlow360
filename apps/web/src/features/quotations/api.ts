import { apiClient } from '@/lib/api-client';
import { Product, QuoteRecalculateRequest, QuoteRecalculateResponse } from './types';

export const quotationsApi = {
  getProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>('/quotations/products');
    return response.data;
  },

  recalculate: async (quotationId: string, request: QuoteRecalculateRequest): Promise<QuoteRecalculateResponse> => {
    const response = await apiClient.post<QuoteRecalculateResponse>(`/quotations/${quotationId}/recalculate`, request);
    return response.data;
  }
};
