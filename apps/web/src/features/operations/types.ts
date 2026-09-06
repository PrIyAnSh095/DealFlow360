export interface Warehouse {
  id: string;
  name: string;
  location: string;
  code?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  capacity?: number;
  is_active?: boolean;
}

export interface StockItem {
  id: string;
  product_id: string;
  product_name: string;
  sku?: string | null;
  warehouse_id: string;
  warehouse_name: string;
  quantity_on_hand: number;
  quantity_allocated: number;
  available_quantity: number;
}

export interface Order {
  id: string;
  quotation_id: string;
  status: "pending_fulfillment" | "processing" | "partially_shipped" | "shipped" | "delivered" | "fulfilled" | "cancelled" | string;
  created_at: string;
  customer_name: string;
  deal_name: string;
  tracking_number?: string | null;
  carrier?: string | null;
  estimated_delivery?: string | null;
  delivery_notes?: string | null;
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

// ─── Fulfillment Plans (Multi-strategy) ────────────────────────────────────────

export interface FulfillmentPlanAllocation {
  quote_line_id: string;
  product_id: string;
  product_name: string;
  warehouse_id: string;
  warehouse_name: string;
  quantity: number;
}

export interface FulfillmentPlanBackorder {
  quote_line_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
}

export interface FulfillmentPlan {
  plan_id: string;
  name: string;
  /** e.g. "Recommended" | "Lowest Cost" | "Fastest" | "Fewest Shipments" */
  tag: string;
  num_shipments: number;
  warehouses_used: string[];
  /** Shipping cost in rupees */
  shipping_cost: number;
  product_cost: number;
  total_order_cost: number;
  /** ETA date string or descriptive string */
  eta: string;
  deal_margin: number;
  margin_percentage: number;
  allocations: FulfillmentPlanAllocation[];
  backorders: FulfillmentPlanBackorder[];
  /** "Shiprocket" or "InternalRateCard" — set by backend shipping_service */
  shipping_adapter?: string;
}

export interface FulfillmentPlansResponse {
  order_id: string;
  plans: FulfillmentPlan[];
}
