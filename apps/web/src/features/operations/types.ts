export interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity?: number;
  is_active?: boolean;
}

export interface Order {
  id: string;
  quotation_id: string;
  status: "pending_fulfillment" | "fulfilled" | "invoiced";
  created_at: string;
  customer_name: string;
  deal_name: string;
}

export interface FulfillmentAllocationInput {
  quote_line_id: string;
  warehouse_id: string | null;
  quantity: number;
}

export interface FulfillmentRecommendationLine {
  quote_line_id: string;
  product_name: string;
  requested_quantity: number;
  recommended_allocations: FulfillmentAllocationInput[];
}

export interface FulfillmentRecommendationResponse {
  order_id: string;
  lines: FulfillmentRecommendationLine[];
}

export interface WarehouseStock {
  name: string;
  location: string;
  available: number;
}

export interface Backorder {
  id: string;
  orderId: string;
  customer: string;
  product: string;
  sku: string;
  ordered: number;
  shipped: number;
  pending: number;
  status: "waiting" | "partial" | "sourcing" | "cancelled";
  orderDate: string;
  eta: string | null;
  valueAtRisk: number;
  warehouses: WarehouseStock[];
}
