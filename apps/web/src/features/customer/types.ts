// Customer Portal Types

export type QuotationStatus =
  | "sent"
  | "under_review"
  | "negotiating"
  | "approved"
  | "rejected"
  | "expired";

export type OrderStatus =
  | "confirmed"
  | "processing"
  | "partially_shipped"
  | "shipped"
  | "delivered"
  | "cancelled";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";

export type SubscriptionStatus = "active" | "paused" | "cancelled" | "trial";

export type NegotiationRequestType =
  | "price"
  | "quantity"
  | "discount"
  | "question"
  | "other";

export interface QuotationLineItem {
  id: string;
  productName: string;
  productType: "hardware" | "service" | "subscription";
  qty: number;
  unitPrice: number;
  discount: number; // percentage
  finalPrice: number; // per unit after discount
  isRecurring?: boolean;
  billingCycle?: "monthly" | "annual";
}

export interface NegotiationRequest {
  id: string;
  lineItemId: string;
  type: NegotiationRequestType;
  requestedPrice?: number;
  requestedQty?: number;
  requestedDiscount?: number;
  message: string;
  status: "pending" | "accepted" | "rejected" | "counter_offered";
  counterOffer?: number;
  createdAt: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  title: string;
  status: QuotationStatus;
  lineItems: QuotationLineItem[];
  subtotal: number;
  totalDiscount: number;
  grandTotal: number;
  validUntil: string;
  createdAt: string;
  salesRep: string;
  negotiationRequests: NegotiationRequest[];
  notes?: string;
}

export interface OrderFulfillment {
  warehouseName: string;
  items: string[];
  status: "pending" | "packed" | "shipped" | "delivered";
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  quotationId: string;
  title: string;
  status: OrderStatus;
  total: number;
  placedAt: string;
  estimatedDelivery?: string;
  fulfillments: OrderFulfillment[];
  hasSubscription: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId?: string;
  description: string;
  status: InvoiceStatus;
  amount: number;
  dueDate: string;
  issuedAt: string;
  paidAt?: string;
  isProratedOrCreditNote?: boolean;
}

export interface Subscription {
  id: string;
  productName: string;
  plan: string;
  status: SubscriptionStatus;
  billingCycle: "monthly" | "annual";
  amount: number;
  nextBillingDate: string;
  startDate: string;
  cancelledAt?: string;
  usagePercent?: number;
}
