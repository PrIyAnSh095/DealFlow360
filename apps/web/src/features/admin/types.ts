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

export interface Category {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CustomerTier {
  id: string;
  name: string;
  baseline_discount: number;
  is_active: boolean;
  created_at: string;
}

export interface DiscountPolicy {
  id: string;
  name: string;
  target_tier: string | null;
  product_category: string | null;
  employee_role: string | null;
  max_discount_percent: number;
  min_margin_percent: number | null;
  is_active: boolean;
  created_at: string;
}

export interface PricingRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: string;
  adjustment_type: string;
  value: number;
  is_active: boolean;
  created_at: string;
}

export interface ApprovalRule {
  id: string;
  name: string;
  risk_threshold: string | null;
  discount_threshold: number | null;
  target_role: string;
  is_active: boolean;
  created_at: string;
}

export interface ApprovalChain {
  id: string;
  name: string;
  sequence: string;
  is_active: boolean;
  created_at: string;
}
