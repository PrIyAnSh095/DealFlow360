"use client";

import Link from "next/link";
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  ChevronRight,
  RefreshCcw,
} from "lucide-react";
import { mockOrders } from "@/features/customer/mock-data";
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
};

const FULFILLMENT_STEP_ICONS = [
  { key: "confirmed", label: "Order Placed", icon: CheckCircle2 },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

function getStepIndex(status: string) {
  if (status === "confirmed" || status === "processing") return 1;
  if (status === "partially_shipped" || status === "shipped") return 2;
  if (status === "delivered") return 3;
  return 0;
}

export default function MyOrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          My Orders
        </h1>
        <p className="text-[13px] text-foreground-muted mt-1">
          Track your confirmed orders and fulfillment status.
        </p>
      </div>

      {/* Orders */}
      <div className="space-y-5">
        {mockOrders.map((order) => {
          const stepIndex = getStepIndex(order.status);

          return (
            <div
              key={order.id}
              className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden hover:border-primary/30 hover:shadow-md transition-all"
            >
              {/* Order header */}
              <div className="px-6 py-4 border-b border-border flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[15px] font-semibold text-foreground">
                        {order.title}
                      </h3>
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border capitalize",
                          STATUS_COLORS[order.status] ??
                            "bg-muted text-foreground-muted border-border"
                        )}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                      {order.hasSubscription && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-success/10 text-success border border-success/20">
                          <RefreshCcw className="w-3 h-3" />
                          Has Subscription
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-foreground-muted mt-0.5">
                      {order.orderNumber} · Placed {order.placedAt}
                      {order.estimatedDelivery &&
                        ` · Est. delivery ${order.estimatedDelivery}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[20px] font-bold text-foreground">
                    {formatINR(order.total)}
                  </p>
                  <Link
                    href={`/portal/orders/${order.id}`}
                    className="text-[12px] text-primary hover:underline flex items-center gap-1 justify-end mt-1"
                  >
                    View Details
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Stepper */}
              <div className="px-6 py-5">
                <div className="flex items-start justify-between relative">
                  {/* Progress line */}
                  <div
                    className="absolute top-4 left-4 right-4 h-0.5 bg-muted"
                    style={{ zIndex: 0 }}
                  >
                    <div
                      className="h-0.5 bg-primary transition-all duration-500"
                      style={{
                        width: `${(stepIndex / (FULFILLMENT_STEP_ICONS.length - 1)) * 100}%`,
                      }}
                    />
                  </div>

                  {FULFILLMENT_STEP_ICONS.map((step, idx) => {
                    const isComplete = idx < stepIndex;
                    const isCurrent = idx === stepIndex;
                    const Icon = step.icon;

                    return (
                      <div
                        key={step.key}
                        className="flex flex-col items-center gap-2 relative z-10"
                        style={{ flex: 1 }}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                            isComplete
                              ? "bg-primary border-primary"
                              : isCurrent
                              ? "bg-surface border-primary"
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
                            "text-[11px] font-medium text-center",
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

              {/* Fulfillments */}
              {order.fulfillments.length > 0 && (
                <div className="px-6 pb-4">
                  <p className="text-[12px] font-semibold text-foreground-muted uppercase tracking-wider mb-3">
                    Fulfillment Splits ({order.fulfillments.length} shipment
                    {order.fulfillments.length > 1 ? "s" : ""})
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {order.fulfillments.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30"
                      >
                        <Truck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground">
                            {f.warehouseName}
                          </p>
                          <ul className="mt-1 space-y-0.5">
                            {f.items.map((item, j) => (
                              <li
                                key={j}
                                className="text-[12px] text-foreground-muted"
                              >
                                · {item}
                              </li>
                            ))}
                          </ul>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={cn(
                                "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border capitalize",
                                STATUS_COLORS[f.status] ??
                                  "bg-muted text-foreground-muted border-border"
                              )}
                            >
                              {f.status}
                            </span>
                            {f.trackingNumber && (
                              <span className="text-[11px] text-primary font-medium">
                                #{f.trackingNumber}
                              </span>
                            )}
                          </div>
                          {f.estimatedDelivery && (
                            <p className="text-[11px] text-foreground-muted mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              ETA {f.estimatedDelivery}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
