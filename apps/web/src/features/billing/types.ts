export interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
}

export interface InvoiceLine {
  id: string;
  product_id: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Invoice {
  id: string;
  order_id: string;
  customer_id: string;
  customer_name: string | null;
  status: string;
  payment_status: string;
  subtotal: number;
  total_discount: number;
  tax: number;
  total: number;
  amount_paid: number;
  created_at: string;
  due_date: string | null;
  lines: InvoiceLine[];
  payments: Payment[];
}

export interface Subscription {
  id: string;
  order_id: string;
  customer_id: string;
  customer_name: string | null;
  product_id: string;
  product_name: string | null;
  status: string;
  interval: string;
  quantity: number;
  price_per_period: number;
  current_period_start: string;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string;
}
