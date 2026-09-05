export interface ApprovalLog {
  id: string;
  action: string;
  reason?: string;
  created_at: string;
}

export interface ApprovalRequestResponse {
  id: string;
  quotation_id: string;
  requester_id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "RETURNED";
  created_at: string;
  deal_name?: string;
  customer_name?: string;
  quote_total?: number;
  quote_margin?: number;
  logs: ApprovalLog[];
}

export interface ApprovalActionRequest {
  reason: string;
}
