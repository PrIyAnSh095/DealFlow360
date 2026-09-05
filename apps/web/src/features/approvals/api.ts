import { apiClient } from '@/lib/api-client';
import { ApprovalRequestResponse, ApprovalActionRequest } from './types';

export const approvalsApi = {
  getApprovals: async (): Promise<ApprovalRequestResponse[]> => {
    const response = await apiClient.get<any[]>('/approvals');
    return response.data.map(item => ({
      id: item.id,
      quotation_id: item.quotation_id,
      requester_id: item.requester_id || "u-sales",
      status: item.status,
      created_at: item.created_at,
      deal_name: item.customer_name ? `Quotation for ${item.customer_name}` : "Deal Quotation",
      customer_name: item.customer_name || "Acme Corp",
      quote_total: item.deal_value || 0,
      quote_margin: item.margin_percentage || 0,
      logs: item.logs || []
    }));
  },

  approve: async (id: string, payload: ApprovalActionRequest): Promise<void> => {
    await apiClient.post(`/approvals/${id}/approve`, payload);
  },

  reject: async (id: string, payload: ApprovalActionRequest): Promise<void> => {
    await apiClient.post(`/approvals/${id}/reject`, payload);
  },
  
  returnQuote: async (id: string, payload: ApprovalActionRequest): Promise<void> => {
    await apiClient.post(`/approvals/${id}/action`, { action: "RETURNED", reason: payload.reason });
  }
};
