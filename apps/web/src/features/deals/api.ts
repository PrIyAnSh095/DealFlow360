import { apiClient } from '@/lib/api-client';
import { Deal, DealStatus } from "./types";

export const dealsApi = {
  getDeals: async (): Promise<Deal[]> => {
    const response = await apiClient.get<Deal[]>('/deals/');
    return response.data;
  },
  
  getDeal: async (id: string): Promise<Deal> => {
    const response = await apiClient.get<Deal>(`/deals/${id}`);
    return response.data;
  },
  
  updateDealStatus: async (id: string, status: DealStatus): Promise<Deal> => {
    const response = await apiClient.patch<Deal>(`/deals/${id}`, { status });
    return response.data;
  },

  createDeal: async (deal: { customer_id: string; value?: number; status?: string; risk?: string }): Promise<Deal> => {
    const response = await apiClient.post<Deal>('/deals/', deal);
    return response.data;
  },

  getNegotiations: async () => {
    try {
      const response = await apiClient.get('/negotiations/');
      return response.data || [];
    } catch {
      return [];
    }
  },

  respondToNegotiation: async (messageId: string, payload: { action: string; message?: string; counter_discount_pct?: number }) => {
    const response = await apiClient.post(`/negotiations/${messageId}/respond`, payload);
    return response.data;
  }
};
