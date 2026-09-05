export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  sales_price: number;
  cost: number;
  is_active: boolean;
}

export interface QuoteLineInput {
  product_id: string;
  quantity: number;
  discount_percent: number;
}

export interface QuoteRecalculateRequest {
  lines: QuoteLineInput[];
}

export interface QuoteLineResponse {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  line_total: number;
  line_margin_percent: number;
}

export interface QuoteRecalculateResponse {
  subtotal: number;
  total_discount: number;
  total: number;
  estimated_cost: number;
  margin_percentage: number;
  risk_score: "LOW" | "MEDIUM" | "HIGH";
  requires_approval: boolean;
  explanations: string[];
  lines: QuoteLineResponse[];
}

export interface QuotationCreate {
  deal_id: string;
  lines: QuoteLineInput[];
}

export interface QuotationResponse {
  id: string;
  deal_id: string;
  customer_name?: string;
  status: string;
  subtotal: number;
  total_discount: number;
  total: number;
  margin_percentage: number;
  risk_score: "LOW" | "MEDIUM" | "HIGH";
  requires_approval: boolean;
  lines?: QuoteLineResponse[];
}
