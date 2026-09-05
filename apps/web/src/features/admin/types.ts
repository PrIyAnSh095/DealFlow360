export interface PricingRule {
  id: string;
  name: string;
  target_role: string;
  max_discount_percent: number;
  requires_approval_above: number;
  is_active: boolean;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  interval: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

export interface GlobalSetting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}
