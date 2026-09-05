import { apiClient } from '@/lib/api-client';
import { ApprovalRequestResponse, ApprovalActionRequest } from './types';

export const approvalsApi = {
  getApprovals: async (): Promise<ApprovalRequestResponse[]> => {
    const response = await apiClient.get<ApprovalRequestResponse[]>('/approvals');
    return response.data;
  },

  approve: async (id: string, payload: ApprovalActionRequest): Promise<void> => {
    await apiClient.post(`/approvals/${id}/approve`, payload);
  },

  reject: async (id: string, payload: ApprovalActionRequest): Promise<void> => {
    await apiClient.post(`/approvals/${id}/reject`, payload);
  },
  
  returnQuote: async (id: string, payload: ApprovalActionRequest): Promise<void> => {
    await apiClient.post(`/approvals/${id}/return`, payload);
  }
};
