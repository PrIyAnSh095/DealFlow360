import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from './api';
import { PricingRule, SubscriptionPlan, GlobalSetting } from './types';
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
