"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ShoppingBag,
  Truck,
  Package,
  Clock,
  CheckCircle2,
  MapPin,
  Hash,
  RefreshCcw,
  Receipt,
  ExternalLink,
} from "lucide-react";
import { mockOrders, mockInvoices } from "@/features/customer/mock-data";
import { cn } from "@/lib/utils";

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-primary/10 text-primary border-primary/20",
  processing: "bg-warning/10 text-warning border-warning/20",
  partially_shipped: "bg-warning/10 text-warning border-warning/20",
  shipped: "bg-primary/10 text-primary border-primary/20",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-danger/10 text-danger border-danger/20",
  paid: "bg-success/10 text-success border-success/20",
  sent: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  packed: "bg-warning/10 text-warning border-warning/20",
};

const TIMELINE_STEPS = [
  { label: "Order Placed", icon: CheckCircle2 },
  { label: "Processing", icon: Package },
  { label: "Shipped", icon: Truck },
  { label: "Delivered", icon: CheckCircle2 },
];

function getStepIndex(status: string) {
  if (status === "confirmed" || status === "processing") return 1;
  if (status === "partially_shipped" || status === "shipped") return 2;
  if (status === "delivered") return 3;
  return 0;
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const order = mockOrders.find((o) => o.id === orderId) ?? mockOrders[0];
  const relatedInvoices = mockInvoices.filter((inv) => inv.orderId === order.id);
  const stepIndex = getStepIndex(order.status);

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px]">
        <Link
          href="/portal/orders"
          className="flex items-center gap-1 text-foreground-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          My Orders
        </Link>
        <span className="text-foreground-muted">/</span>
        <span className="text-foreground font-medium">{order.orderNumber}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6 text-warning" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">
                {order.title}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-semibold border capitalize",
                  STATUS_COLORS[order.status] ??
                    "bg-muted text-foreground-muted border-border"
                )}
              >
                {order.status.replace(/_/g, " ")}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-[12px] text-foreground-muted flex-wrap">
              <span className="flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" />
                {order.orderNumber}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Placed {order.placedAt}
              </span>
              {order.estimatedDelivery && (
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" />
                  Est. {order.estimatedDelivery}
                </span>
              )}
              {order.hasSubscription && (
                <span className="flex items-center gap-1 text-success">
                  <RefreshCcw className="w-3.5 h-3.5" />
                  Includes Subscription
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[24px] font-bold text-foreground">
            {formatINR(order.total)}
          </p>
          <Link
            href="/portal/invoices"
            className="text-[12px] text-primary hover:underline flex items-center gap-1 justify-end mt-1"
          >
            <Receipt className="w-3.5 h-3.5" />
            View Invoices
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Fulfillment */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Progress */}
          <div className="bg-surface border border-border rounded-lg shadow-sm p-6">
            <h2 className="text-[15px] font-semibold text-foreground mb-6">
              Fulfillment Progress
            </h2>
            <div className="flex items-start justify-between relative">
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted z-0">
                <div
                  className="h-0.5 bg-primary transition-all duration-700"
                  style={{
                    width: `${(stepIndex / (TIMELINE_STEPS.length - 1)) * 100}%`,
                  }}
                />
              </div>
              {TIMELINE_STEPS.map((step, idx) => {
                const isComplete = idx < stepIndex;
                const isCurrent = idx === stepIndex;
                const Icon = step.icon;
                return (
                  <div
                    key={step.label}
                    className="flex flex-col items-center gap-2 relative z-10"
                    style={{ flex: 1 }}
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all",
                        isComplete
                          ? "bg-primary border-primary"
                          : isCurrent
                          ? "bg-surface border-primary ring-4 ring-primary/20"
                          : "bg-surface border-border"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4",
                          isComplete
                            ? "text-primary-foreground"
                            : isCurrent
                            ? "text-primary"
                            : "text-foreground-muted"
                        )}
                      />
                    </div>
                    <p
                      className={cn(
                        "text-[12px] font-medium text-center",
                        isComplete || isCurrent
                          ? "text-foreground"
                          : "text-foreground-muted"
                      )}
                    >
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipments */}
          <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-[15px] font-semibold text-foreground">
                Shipment Details ({order.fulfillments.length} shipment
                {order.fulfillments.length > 1 ? "s" : ""})
              </h2>
            </div>
            <div className="divide-y divide-border">
              {order.fulfillments.map((f, i) => (
                <div key={i} className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-foreground">
                          Shipment {i + 1}
                        </p>
                        <p className="text-[12px] text-foreground-muted flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {f.warehouseName}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium border capitalize",
                        STATUS_COLORS[f.status] ??
                          "bg-muted text-foreground-muted border-border"
                      )}
                    >
                      {f.status}
                    </span>
                  </div>

                  <div className="ml-12 space-y-2">
                    <div>
                      <p className="text-[11px] text-foreground-muted uppercase tracking-wider font-semibold mb-1">
                        Items
                      </p>
                      <ul className="space-y-0.5">
                        {f.items.map((item, j) => (
                          <li key={j} className="text-[13px] text-foreground flex items-center gap-1.5">
                            <Package className="w-3 h-3 text-foreground-muted" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {f.trackingNumber && (
                      <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <Hash className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <p className="text-[11px] text-foreground-muted">
                            Tracking Number
                          </p>
                          <p className="text-[13px] font-bold text-primary">
                            {f.trackingNumber}
                          </p>
                        </div>
                        <button className="ml-auto text-primary hover:text-primary/80 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {f.estimatedDelivery && (
                      <p className="text-[12px] text-foreground-muted flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Estimated delivery: {f.estimatedDelivery}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Summary + Invoices */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface border border-border rounded-lg shadow-sm p-5">
            <h2 className="text-[15px] font-semibold text-foreground mb-4">
              Order Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-[13px]">
                <span className="text-foreground-muted">Order Number</span>
                <span className="font-medium text-foreground">
                  {order.orderNumber}
                </span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-foreground-muted">Order Date</span>
                <span className="font-medium text-foreground">
                  {order.placedAt}
                </span>
              </div>
              {order.estimatedDelivery && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-foreground-muted">Est. Delivery</span>
                  <span className="font-medium text-foreground">
                    {order.estimatedDelivery}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[13px]">
                <span className="text-foreground-muted">Shipments</span>
                <span className="font-medium text-foreground">
                  {order.fulfillments.length}
                </span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between text-[14px] font-bold">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">{formatINR(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Related Invoices */}
          {relatedInvoices.length > 0 && (
            <div className="bg-surface border border-border rounded-lg shadow-sm p-5">
              <h2 className="text-[15px] font-semibold text-foreground mb-4 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-foreground-muted" />
                Related Invoices
              </h2>
              <div className="space-y-3">
                {relatedInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <p className="text-[13px] font-medium text-foreground">
                        {inv.invoiceNumber}
                      </p>
                      <p className="text-[11px] text-foreground-muted">
                        Due {inv.dueDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-bold text-foreground">
                        {formatINR(inv.amount)}
                      </p>
                      <span
                        className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border capitalize",
                          STATUS_COLORS[inv.status] ??
                            "bg-muted text-foreground-muted border-border"
                        )}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/portal/invoices"
                className="mt-3 text-[13px] text-primary font-medium hover:underline flex items-center gap-1"
              >
                View all invoices
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
