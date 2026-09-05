import { apiClient } from '@/lib/api-client';
import { AnalyticsDashboard } from './types';

export const analyticsApi = {
  getDashboard: async (): Promise<AnalyticsDashboard> => {
    const response = await apiClient.get<AnalyticsDashboard>('/analytics');
    return response.data;
  }
};
