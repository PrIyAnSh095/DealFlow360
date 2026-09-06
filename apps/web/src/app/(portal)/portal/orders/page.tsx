"use client";

import Link from "next/link";
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  Package,
  ChevronRight,
  RefreshCcw,
} from "lucide-react";
import { customerApi, CustomerOrder } from "@/features/customer/api";
import { useOrgConfig, formatCurrency } from "@/features/customer/useOrgConfig";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-primary/10 text-primary border-primary/20",
  pending_fulfillment: "bg-warning/10 text-warning border-warning/20",
  processing: "bg-warning/10 text-warning border-warning/20",
  partially_shipped: "bg-warning/10 text-warning border-warning/20",
  shipped: "bg-primary/10 text-primary border-primary/20",
  fulfilled: "bg-success/10 text-success border-success/20",
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
  if (status === "confirmed" || status === "pending_fulfillment" || status === "processing") return 1;
  if (status === "partially_shipped" || status === "shipped") return 2;
  if (status === "delivered" || status === "fulfilled") return 3;
  return 0;
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    customerApi
      .getOrders()
      .then(setOrders)
      .catch((err) => {
        console.error("Failed to load orders:", err);
        setOrders([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="p-8 text-[13px] text-foreground-muted flex items-center justify-center h-full">Loading orders...</div>;
  }

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
        {orders.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg p-12 text-center">
            <ShoppingBag className="w-10 h-10 text-foreground-muted mx-auto mb-3" />
            <p className="text-[14px] font-medium text-foreground">
              No orders found
            </p>
          </div>
        ) : (
          orders.map((order) => {
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
                          {order.deal_name}
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
                      </div>
                      <p className="text-[12px] text-foreground-muted mt-0.5">
                        {order.id.slice(0, 8)} · Placed {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
