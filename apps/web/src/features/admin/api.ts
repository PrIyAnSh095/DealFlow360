import { apiClient } from '@/lib/api-client';
import { PricingRule, SubscriptionPlan, GlobalSetting, Category, CustomerTier, DiscountPolicy, ApprovalRule, ApprovalChain } from './types';
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

  // Categories
  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>('/admin/categories');
    return response.data;
  },
  createCategory: async (data: Partial<Category>): Promise<Category> => {
    const response = await apiClient.post<Category>('/admin/categories', data);
    return response.data;
  },
  updateCategory: async (id: string, data: Partial<Category>): Promise<Category> => {
    const response = await apiClient.patch<Category>(`/admin/categories/${id}`, data);
    return response.data;
  },
  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/categories/${id}`);
  },

  // Customer Tiers
  getCustomerTiers: async (): Promise<CustomerTier[]> => {
    const response = await apiClient.get<CustomerTier[]>('/admin/customer-tiers');
    return response.data;
  },
  createCustomerTier: async (data: Partial<CustomerTier>): Promise<CustomerTier> => {
    const response = await apiClient.post<CustomerTier>('/admin/customer-tiers', data);
    return response.data;
  },
  updateCustomerTier: async (id: string, data: Partial<CustomerTier>): Promise<CustomerTier> => {
    const response = await apiClient.patch<CustomerTier>(`/admin/customer-tiers/${id}`, data);
    return response.data;
  },
  deleteCustomerTier: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/customer-tiers/${id}`);
  },

  // Discount Policies
  getDiscountPolicies: async (): Promise<DiscountPolicy[]> => {
    const response = await apiClient.get<DiscountPolicy[]>('/admin/discount-policies');
    return response.data;
  },
  createDiscountPolicy: async (data: Partial<DiscountPolicy>): Promise<DiscountPolicy> => {
    const response = await apiClient.post<DiscountPolicy>('/admin/discount-policies', data);
    return response.data;
  },
  updateDiscountPolicy: async (id: string, data: Partial<DiscountPolicy>): Promise<DiscountPolicy> => {
    const response = await apiClient.patch<DiscountPolicy>(`/admin/discount-policies/${id}`, data);
    return response.data;
  },
  deleteDiscountPolicy: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/discount-policies/${id}`);
  },

  // Approval Rules
  getApprovalRules: async (): Promise<ApprovalRule[]> => {
    const response = await apiClient.get<ApprovalRule[]>('/admin/approval-rules');
    return response.data;
  },
  createApprovalRule: async (data: Partial<ApprovalRule>): Promise<ApprovalRule> => {
    const response = await apiClient.post<ApprovalRule>('/admin/approval-rules', data);
    return response.data;
  },
  updateApprovalRule: async (id: string, data: Partial<ApprovalRule>): Promise<ApprovalRule> => {
    const response = await apiClient.patch<ApprovalRule>(`/admin/approval-rules/${id}`, data);
    return response.data;
  },
  deleteApprovalRule: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/approval-rules/${id}`);
  },

  // Approval Chains
  getApprovalChains: async (): Promise<ApprovalChain[]> => {
    const response = await apiClient.get<ApprovalChain[]>('/admin/approval-chains');
    return response.data;
  },
  createApprovalChain: async (data: Partial<ApprovalChain>): Promise<ApprovalChain> => {
    const response = await apiClient.post<ApprovalChain>('/admin/approval-chains', data);
    return response.data;
  },
  updateApprovalChain: async (id: string, data: Partial<ApprovalChain>): Promise<ApprovalChain> => {
    const response = await apiClient.patch<ApprovalChain>(`/admin/approval-chains/${id}`, data);
    return response.data;
  },
  deleteApprovalChain: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/approval-chains/${id}`);
  },

  // AI Config
  getAiConfig: async (): Promise<any> => {
    const response = await apiClient.get<any>('/admin/ai-config');
    return response.data;
  },
  updateAiConfig: async (data: any): Promise<any> => {
    const response = await apiClient.put<any>('/admin/ai-config', data);
    return response.data;
  },
};
