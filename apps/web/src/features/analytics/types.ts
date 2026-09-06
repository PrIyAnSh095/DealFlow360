export interface AnalyticsOverview {
  total_revenue: number;
  win_rate: number;
  avg_cycle_time_days: number;
  avg_discount: number;
  active_deals: number;
  mom_revenue: number;
  mom_win_rate: number;
  mom_cycle_time: number;
  mom_discount: number;
}

export interface TrendPoint {
  label: string;
  value: number;
}

export interface AnalyticsDashboard {
  overview: AnalyticsOverview;
  revenue_trend: TrendPoint[];
  discount_trend: TrendPoint[];
}
