import { apiClient } from '@/lib/api-client';
import { PublicQuotationResponse, QuoteMessage, QuoteMessageCreate } from './types';

export const portalApi = {
  getPublicQuote: async (publicId: string): Promise<PublicQuotationResponse> => {
    const response = await apiClient.get<any>(`/portal/${publicId}`);
    const data = response.data;
    return {
      id: data.quotation_id || publicId,
      deal_name: data.customer_name ? `Deal for ${data.customer_name}` : "Official Quotation",
      customer_name: data.customer_name || "Valued Customer",
      status: data.status || "SENT",
      subtotal: data.subtotal || 0,
      total_discount: data.total_discount || 0,
      total: data.total || 0,
      lines: (data.lines || []).map((l: any) => ({
        id: l.id,
        product_name: l.product_name,
        quantity: l.quantity,
        unit_price: l.unit_price,
        discount_percent: l.discount_percent,
        total_price: l.line_total || l.quantity * l.unit_price * (1 - l.discount_percent / 100.0)
      }))
    };
  },

  getMessages: async (publicId: string): Promise<QuoteMessage[]> => {
    const response = await apiClient.get<any>(`/portal/${publicId}`);
    return response.data.messages || [];
  },

  sendMessage: async (publicId: string, payload: QuoteMessageCreate): Promise<QuoteMessage> => {
    const response = await apiClient.post<QuoteMessage>(`/portal/${publicId}/message`, { content: payload.content });
    return response.data;
  },

  confirmQuote: async (publicId: string): Promise<void> => {
    await apiClient.post(`/portal/${publicId}/accept`);
  }
};
