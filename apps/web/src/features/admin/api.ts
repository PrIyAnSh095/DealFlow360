import { apiClient } from '@/lib/api-client';
import { PricingRule, SubscriptionPlan, GlobalSetting } from './types';
import { Product } from '@/features/quotations/types';

export const adminApi = {
  // Products
  getProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>('/admin/products');
    return response.data;
  },
  createProduct: async (data: Partial<Product>): Promise<Product> => {
    const response = await apiClient.post<Product>('/admin/products', data);
    return response.data;
  },
  updateProduct: async (id: string, data: Partial<Product>): Promise<Product> => {
    const response = await apiClient.patch<Product>(`/admin/products/${id}`, data);
    return response.data;
  },

  // Pricing Rules
  getPricingRules: async (): Promise<PricingRule[]> => {
    const response = await apiClient.get<PricingRule[]>('/admin/pricing-rules');
    return response.data;
  },
  createPricingRule: async (data: Partial<PricingRule>): Promise<PricingRule> => {
    const response = await apiClient.post<PricingRule>('/admin/pricing-rules', data);
    return response.data;
  },
  updatePricingRule: async (id: string, data: Partial<PricingRule>): Promise<PricingRule> => {
    const response = await apiClient.patch<PricingRule>(`/admin/pricing-rules/${id}`, data);
    return response.data;
  },
  deletePricingRule: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/pricing-rules/${id}`);
  },

  // Subscription Plans
  getSubscriptionPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await apiClient.get<SubscriptionPlan[]>('/admin/subscription-plans');
    return response.data;
  },
  createSubscriptionPlan: async (data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
    const response = await apiClient.post<SubscriptionPlan>('/admin/subscription-plans', data);
    return response.data;
  },
  updateSubscriptionPlan: async (id: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
    const response = await apiClient.patch<SubscriptionPlan>(`/admin/subscription-plans/${id}`, data);
    return response.data;
  },
  deleteSubscriptionPlan: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/subscription-plans/${id}`);
  },

  // Settings
  getSettings: async (): Promise<GlobalSetting[]> => {
    const response = await apiClient.get<GlobalSetting[]>('/admin/settings');
    return response.data;
  },
  createSetting: async (data: Partial<GlobalSetting>): Promise<GlobalSetting> => {
    const response = await apiClient.post<GlobalSetting>('/admin/settings', data);
    return response.data;
  },
  updateSetting: async (key: string, data: Partial<GlobalSetting>): Promise<GlobalSetting> => {
    const response = await apiClient.patch<GlobalSetting>(`/admin/settings/${key}`, data);
    return response.data;
  },
};
