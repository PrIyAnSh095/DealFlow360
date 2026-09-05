import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from './api';
import { PricingRule, SubscriptionPlan, GlobalSetting, Category, CustomerTier, DiscountPolicy, ApprovalRule, ApprovalChain } from './types';
import { Product } from '@/features/quotations/types';

// Products
export const useAdminProducts = () => useQuery({ queryKey: ['admin_products'], queryFn: adminApi.getProducts });
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_products'] }),
  });
};
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) => adminApi.updateProduct(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_products'] }),
  });
};

// Pricing Rules
export const usePricingRules = () => useQuery({ queryKey: ['pricing_rules'], queryFn: adminApi.getPricingRules });
export const useCreatePricingRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createPricingRule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pricing_rules'] }),
  });
};
export const useUpdatePricingRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PricingRule> }) => adminApi.updatePricingRule(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pricing_rules'] }),
  });
};
export const useDeletePricingRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deletePricingRule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pricing_rules'] }),
  });
};

// Subscription Plans
export const useSubscriptionPlans = () => useQuery({ queryKey: ['subscription_plans'], queryFn: adminApi.getSubscriptionPlans });
export const useCreateSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createSubscriptionPlan,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscription_plans'] }),
  });
};
export const useUpdateSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SubscriptionPlan> }) => adminApi.updateSubscriptionPlan(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscription_plans'] }),
  });
};
export const useDeleteSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteSubscriptionPlan,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscription_plans'] }),
  });
};

// Settings
export const useSettings = () => useQuery({ queryKey: ['global_settings'], queryFn: adminApi.getSettings });
export const useCreateSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createSetting,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['global_settings'] }),
  });
};
export const useUpdateSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, data }: { key: string; data: Partial<GlobalSetting> }) => adminApi.updateSetting(key, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['global_settings'] }),
  });
};

// Categories
export const useCategories = () => useQuery({ queryKey: ['admin_categories'], queryFn: adminApi.getCategories });
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_categories'] }),
  });
};
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) => adminApi.updateCategory(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_categories'] }),
  });
};
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_categories'] }),
  });
};

// Customer Tiers
export const useCustomerTiers = () => useQuery({ queryKey: ['admin_customer_tiers'], queryFn: adminApi.getCustomerTiers });
export const useCreateCustomerTier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createCustomerTier,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_customer_tiers'] }),
  });
};
export const useUpdateCustomerTier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerTier> }) => adminApi.updateCustomerTier(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_customer_tiers'] }),
  });
};
export const useDeleteCustomerTier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteCustomerTier,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_customer_tiers'] }),
  });
};

// Discount Policies
export const useDiscountPolicies = () => useQuery({ queryKey: ['admin_discount_policies'], queryFn: adminApi.getDiscountPolicies });
export const useCreateDiscountPolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createDiscountPolicy,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_discount_policies'] }),
  });
};
export const useUpdateDiscountPolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DiscountPolicy> }) => adminApi.updateDiscountPolicy(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_discount_policies'] }),
  });
};
export const useDeleteDiscountPolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteDiscountPolicy,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_discount_policies'] }),
  });
};

// Approval Rules
export const useApprovalRules = () => useQuery({ queryKey: ['admin_approval_rules'], queryFn: adminApi.getApprovalRules });
export const useCreateApprovalRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createApprovalRule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_approval_rules'] }),
  });
};
export const useUpdateApprovalRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ApprovalRule> }) => adminApi.updateApprovalRule(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_approval_rules'] }),
  });
};
export const useDeleteApprovalRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteApprovalRule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_approval_rules'] }),
  });
};

// Approval Chains
export const useApprovalChains = () => useQuery({ queryKey: ['admin_approval_chains'], queryFn: adminApi.getApprovalChains });
export const useCreateApprovalChain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createApprovalChain,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_approval_chains'] }),
  });
};
export const useUpdateApprovalChain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ApprovalChain> }) => adminApi.updateApprovalChain(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_approval_chains'] }),
  });
};
export const useDeleteApprovalChain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteApprovalChain,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_approval_chains'] }),
  });
};
