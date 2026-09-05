export type DealStatus = 
  | 'draft' 
  | 'review' 
  | 'approval' 
  | 'negotiation' 
  | 'confirmed' 
  | 'fulfillment' 
  | 'completed';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface Deal {
  id: string;
  name: string;
  customerName: string;
  value: number;
  margin: number;
  discount: number;
  status: DealStatus;
  risk: RiskLevel;
  ownerId: string;
  ownerInitials: string;
  updatedAt: string;
  nextAction?: string;
}
