import { apiClient } from '@/lib/api-client';

export interface DealHealthResponse {
  id: string;
  deal_id: string;
  customer_name: string;
  health_score: number;
  margin_health: string;
  discount_risk: string;
  inventory_risk: string;
  engagement: string;
  issues: string[];
}

export const healthApi = {
  getHealth: async (): Promise<DealHealthResponse[]> => {
    const response = await apiClient.get<DealHealthResponse[]>('/health');
    return response.data;
  }
};
