import { apiClient } from '@/lib/api-client';

export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  tier: string;
}

export const customersApi = {
  getCustomers: async (): Promise<Customer[]> => {
    const response = await apiClient.get<Customer[]>('/customers/options');
    return response.data;
  },
  
  createCustomer: async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
    const response = await apiClient.post<Customer>('/customers', customer);
    return response.data;
  }
};
