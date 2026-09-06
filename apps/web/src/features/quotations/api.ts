import { apiClient } from '@/lib/api-client';
import { Product, QuoteRecalculateRequest, QuoteRecalculateResponse, QuotationResponse, QuotationCreate } from './types';

export const quotationsApi = {
  getProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>('/quotations/products');
    return response.data;
  },

  recalculate: async (quotationId: string, request: QuoteRecalculateRequest): Promise<QuoteRecalculateResponse> => {
    const response = await apiClient.post<QuoteRecalculateResponse>(`/quotations/${quotationId}/recalculate`, request);
    return response.data;
  },

  getQuotations: async (): Promise<QuotationResponse[]> => {
    try {
      const response = await apiClient.get<QuotationResponse[]>('/quotations');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch quotations:', error);
      return [];
    }
  },

  createQuotation: async (request: QuotationCreate): Promise<QuotationResponse> => {
    const response = await apiClient.post<QuotationResponse>('/quotations', request);
    return response.data;
  },

  submitQuotation: async (quotationId: string): Promise<QuotationResponse> => {
    const response = await apiClient.post<QuotationResponse>(`/quotations/${quotationId}/submit`);
    return response.data;
  },

  getAiExplanation: async (quotationId: string): Promise<any> => {
    const response = await apiClient.post<any>(`/quotations/${quotationId}/ai-explanation`);
    return response.data;
  },

  updateQuotationStatus: async (quotationId: string, status: string, notes?: string): Promise<any> => {
    const response = await apiClient.patch<any>(`/quotations/${quotationId}/status`, { status, notes });
    return response.data;
  }
};
