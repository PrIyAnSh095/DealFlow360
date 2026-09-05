export type DealStatus = 
  | 'draft' 
  | 'review' 
  | 'approval' 
  | 'negotiation' 
  | 'confirmed' 
  | 'fulfillment' 
  | 'completed';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  tier: string;
}

export interface Deal {
  id: string;
  customer_id: string;
  customer?: Customer;
  value: number;
  status: DealStatus;
  risk: RiskLevel;
  created_at: string;
  updated_at: string;
}
