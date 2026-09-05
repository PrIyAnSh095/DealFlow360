

export interface PublicQuotationResponse {
  id: string;
  deal_name: string;
  customer_name: string;
  status: string;
  subtotal: number;
  total_discount: number;
  total: number;
  lines: Array<{
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    discount_percent: number;
    total_price: number;
  }>;
}

export interface QuoteMessage {
  id: string;
  quotation_id: string;
  sender_type: "INTERNAL" | "CUSTOMER" | "SYSTEM";
  content: string;
  created_at: string;
}

export interface QuoteMessageCreate {
  content: string;
  sender_type: "INTERNAL" | "CUSTOMER";
}
