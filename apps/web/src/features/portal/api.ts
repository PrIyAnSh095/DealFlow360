import { apiClient } from '@/lib/api-client';
import { PublicQuotationResponse, QuoteMessage, QuoteMessageCreate } from './types';

export const portalApi = {
  getPublicQuote: async (publicId: string): Promise<PublicQuotationResponse> => {
    // Portal requests do not need Authorization header, but apiClient will send it if available.
    // That's fine, backend allows it regardless.
    const response = await apiClient.get<PublicQuotationResponse>(`/portal/quotes/${publicId}`);
    return response.data;
  },

  getMessages: async (publicId: string): Promise<QuoteMessage[]> => {
    const response = await apiClient.get<QuoteMessage[]>(`/portal/quotes/${publicId}/messages`);
    return response.data;
  },

  sendMessage: async (publicId: string, payload: QuoteMessageCreate): Promise<QuoteMessage> => {
    const response = await apiClient.post<QuoteMessage>(`/portal/quotes/${publicId}/messages`, payload);
    return response.data;
  },

  confirmQuote: async (publicId: string): Promise<void> => {
    await apiClient.post(`/portal/quotes/${publicId}/confirm`);
  }
};
