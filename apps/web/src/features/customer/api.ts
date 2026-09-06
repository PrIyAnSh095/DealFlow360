import { apiClient } from '@/lib/api-client';

export interface CustomerQuotation {
  id: string;
  deal_name: string;
  customer_name: string;
  status: string;
  subtotal: number;
  total_discount: number;
  total: number;
  lines: any[];
}

export interface CustomerOrder {
  id: string;
  quotation_id: string;
  status: string;
  created_at: string;
  customer_name: string;
  deal_name: string;
}

export type CustomerInvoice = any;

export const customerApi = {
  getQuotations: async (): Promise<CustomerQuotation[]> => {
    const response = await apiClient.get<CustomerQuotation[]>('/customers/me/quotations');
    return response.data;
  },

  getOrders: async (): Promise<CustomerOrder[]> => {
    const response = await apiClient.get<CustomerOrder[]>('/customers/me/orders');
    return response.data;
  },

  getInvoices: async (): Promise<CustomerInvoice[]> => {
    const response = await apiClient.get<CustomerInvoice[]>('/billing/invoices');
    // Assuming backend returns invoices for the current customer due to RoleChecker
    // We might need to map backend schema to CustomerInvoice schema if they differ
    return response.data;
  },
  
  getSubscriptions: async (): Promise<any[]> => {
    const response = await apiClient.get('/billing/subscriptions');
    return response.data;
  },
  
  cancelSubscription: async (subId: string): Promise<void> => {
    await apiClient.post(`/customers/me/subscriptions/${subId}/cancel`);
  },

  downloadQuotationPdf: async (quotationId: string): Promise<Blob> => {
    const response = await apiClient.get(`/customers/me/quotations/${quotationId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
