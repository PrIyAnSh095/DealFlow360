import { apiClient } from '@/lib/api-client';
import { DashboardMetrics, ActivityLog } from './types';

export const dashboardApi = {
  getMetrics: async (period?: string): Promise<DashboardMetrics> => {
    const response = await apiClient.get<DashboardMetrics>('/dashboard/metrics', {
      params: period ? { period } : undefined
    });
    return response.data;
  },
  
  getActivities: async (): Promise<ActivityLog[]> => {
    const response = await apiClient.get<ActivityLog[]>('/dashboard/activities');
    return response.data;
  }
};
