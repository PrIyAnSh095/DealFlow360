export interface DashboardMetrics {
  revenue_pipeline: number;
  pipeline_growth_percent: number;
  deals_at_risk: number;
  pending_approvals: number;
  pending_approval_value: number;
  open_deals: number;
  total_users?: number;
  active_customers?: number;
  total_products?: number;
  active_subscriptions?: number;
}

export interface ActivityLog {
  id: string;
  action_by: string;
  initials: string;
  action_type: string;
  target_name: string;
  timestamp: string;
  color_hint: string;
}
