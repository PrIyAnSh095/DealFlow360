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
    try {
      const response = await apiClient.get<CustomerInvoice[]>('/billing/invoices');
      return response.data;
    } catch {
      return [];
    }
  },
  
  getSubscriptions: async (): Promise<any[]> => {
    try {
      const response = await apiClient.get('/billing/subscriptions');
      return response.data;
    } catch {
      return [];
    }
  }
};
