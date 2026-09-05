"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ShoppingBag,
  Clock,
  Hash,
} from "lucide-react";
import { customerApi, CustomerOrder } from "@/features/customer/api";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-primary/10 text-primary border-primary/20",
  processing: "bg-warning/10 text-warning border-warning/20",
  partially_shipped: "bg-warning/10 text-warning border-warning/20",
  shipped: "bg-primary/10 text-primary border-primary/20",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-danger/10 text-danger border-danger/20",
  pending_fulfillment: "bg-warning/10 text-warning border-warning/20",
  fulfilled: "bg-success/10 text-success border-success/20",
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    customerApi.getOrders().then(orders => {
      const found = orders.find((o) => o.id === orderId);
      if (found) {
        setOrder(found);
      }
    }).finally(() => setIsLoading(false));
  }, [orderId]);

  if (isLoading) {
    return <div className="p-8 text-[13px] text-foreground-muted flex items-center justify-center h-[60vh]">Loading order...</div>;
  }

  if (!order) {
    return <div className="p-8 text-[13px] text-foreground-muted flex items-center justify-center h-[60vh]">Order not found</div>;
  }

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
        <span className="text-foreground font-medium">{order.id.slice(0, 8)}</span>
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
                {order.deal_name || "Order"}
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
                {order.id.slice(0, 8)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Placed {new Date(order.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-surface border border-border rounded-lg shadow-sm p-6">
            <h2 className="text-[15px] font-semibold text-foreground mb-6">
              Fulfillment Status
            </h2>
            <p className="text-[13px] text-foreground-muted">
              Detailed tracking is not yet integrated. Your order is currently: <span className="font-semibold text-foreground">{order.status.replace(/_/g, " ")}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-surface border border-border rounded-lg shadow-sm p-5">
            <h2 className="text-[15px] font-semibold text-foreground mb-4">
              Order Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-[13px]">
                <span className="text-foreground-muted">Order Number</span>
                <span className="font-medium text-foreground">
                  {order.id.slice(0, 8)}
                </span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-foreground-muted">Order Date</span>
                <span className="font-medium text-foreground">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
