import { apiClient } from '@/lib/api-client';
import { DashboardMetrics, ActivityLog } from './types';

export const dashboardApi = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const response = await apiClient.get<DashboardMetrics>('/dashboard/metrics');
    return response.data;
  },
  
  getActivities: async (): Promise<ActivityLog[]> => {
    const response = await apiClient.get<ActivityLog[]>('/dashboard/activities');
    return response.data;
  }
};
