import { apiClient } from '@/lib/api-client';
import { Invoice, Subscription, Payment } from './types';

export const billingApi = {
  getInvoices: async (): Promise<Invoice[]> => {
    const response = await apiClient.get<Invoice[]>('/billing/invoices');
    return response.data;
  },

  payInvoice: async (id: string, amount: number, method: string): Promise<Payment> => {
    const response = await apiClient.post<Payment>(`/billing/invoices/${id}/pay`, { amount, method });
    return response.data;
  },

  getSubscriptions: async (): Promise<Subscription[]> => {
    const response = await apiClient.get<Subscription[]>('/billing/subscriptions');
    return response.data;
  },

  modifySubscription: async (id: string, new_quantity: number): Promise<Subscription> => {
    const response = await apiClient.post<Subscription>(`/billing/subscriptions/${id}/modify`, { new_quantity });
    return response.data;
  },

  cancelSubscription: async (id: string): Promise<void> => {
    await apiClient.post(`/billing/subscriptions/${id}/cancel`);
  }
};
