"use client";

import { useState } from "react";
import {
  RefreshCcw,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Zap,
  Calendar,
  BarChart3,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";
import { mockSubscriptions } from "@/features/customer/mock-data";
import { Subscription } from "@/features/customer/types";
import { cn } from "@/lib/utils";

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

const STATUS_META: Record<
  string,
  { color: string; dotColor: string; icon: React.ReactNode; label: string }
> = {
  active: {
    color: "bg-success/10 text-success border-success/20",
    dotColor: "bg-success",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    label: "Active",
  },
  trial: {
    color: "bg-warning/10 text-warning border-warning/20",
    dotColor: "bg-warning",
    icon: <Zap className="w-3.5 h-3.5" />,
    label: "Trial",
  },
  paused: {
    color: "bg-primary/10 text-primary border-primary/20",
    dotColor: "bg-primary",
    icon: <PauseCircle className="w-3.5 h-3.5" />,
    label: "Paused",
  },
  cancelled: {
    color: "bg-muted text-foreground-muted border-border",
    dotColor: "bg-foreground-muted",
    icon: <XCircle className="w-3.5 h-3.5" />,
    label: "Cancelled",
  },
};

function SubscriptionCard({ sub }: { sub: Subscription }) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const meta = STATUS_META[sub.status] ?? STATUS_META["cancelled"];
  const isCancelled = sub.status === "cancelled";

  return (
    <div
      className={cn(
        "bg-surface border rounded-xl shadow-sm overflow-hidden transition-all",
        isCancelled
          ? "border-border opacity-75"
          : "border-border hover:border-primary/30 hover:shadow-md"
      )}
    >
      {/* Card Header */}
      <div className="px-6 py-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
              isCancelled ? "bg-muted" : "bg-primary/10"
            )}
          >
            <RefreshCcw
              className={cn(
                "w-5 h-5",
                isCancelled ? "text-foreground-muted" : "text-primary"
              )}
            />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-[15px] font-bold text-foreground">
                {sub.productName}
              </h3>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border",
                  meta.color
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    meta.dotColor,
                    sub.status === "active" && "animate-pulse"
                  )}
                />
                {meta.label}
              </span>
            </div>
            <p className="text-[12px] text-foreground-muted mt-0.5">
              {sub.plan} · {sub.billingCycle === "monthly" ? "Monthly" : "Annual"} billing
            </p>
            <div className="flex items-center gap-4 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-[12px] text-foreground-muted">
                <Calendar className="w-3.5 h-3.5" />
                Started {sub.startDate}
              </span>
              {!isCancelled && (
                <span className="flex items-center gap-1 text-[12px] text-foreground-muted">
                  <RefreshCcw className="w-3.5 h-3.5" />
                  Renews {sub.nextBillingDate}
                </span>
              )}
              {sub.cancelledAt && (
                <span className="flex items-center gap-1 text-[12px] text-danger">
                  <XCircle className="w-3.5 h-3.5" />
                  Cancelled {sub.cancelledAt}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[22px] font-bold text-foreground">
            {formatINR(sub.amount)}
          </p>
          <p className="text-[12px] text-foreground-muted">
            per {sub.billingCycle === "monthly" ? "month" : "year"}
          </p>
        </div>
      </div>

      {/* Usage bar */}
      {sub.usagePercent !== undefined && !isCancelled && (
        <div className="px-6 pb-4">
          <div className="p-4 rounded-xl bg-muted/40 border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-foreground-muted" />
                <p className="text-[13px] font-medium text-foreground">
                  Usage
                </p>
              </div>
              <p className="text-[13px] font-bold text-foreground">
                {sub.usagePercent}%
              </p>
            </div>
            <div className="h-2.5 bg-background rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-2.5 rounded-full transition-all duration-700",
                  sub.usagePercent > 85
                    ? "bg-danger"
                    : sub.usagePercent > 60
                    ? "bg-warning"
                    : "bg-primary"
                )}
                style={{ width: `${sub.usagePercent}%` }}
              />
            </div>
            {sub.usagePercent > 85 && (
              <div className="flex items-center gap-1.5 mt-2">
                <AlertTriangle className="w-3.5 h-3.5 text-danger" />
                <p className="text-[11px] text-danger font-medium">
                  Nearing limit — consider upgrading your plan
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trial info */}
      {sub.status === "trial" && (
        <div className="px-6 pb-4">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-warning/5 border border-warning/20">
            <Zap className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-medium text-warning">
                Trial Period Active
              </p>
              <p className="text-[12px] text-foreground-muted">
                Your trial ends on {sub.nextBillingDate}. You'll be billed{" "}
                {formatINR(sub.amount)}/mo after that unless you cancel.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer actions */}
      {!isCancelled && (
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-surface text-[12px] font-medium text-foreground-muted hover:text-foreground hover:bg-muted transition-colors">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Upgrade Plan
            </button>
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-surface text-[12px] font-medium text-foreground-muted hover:text-danger hover:border-danger/30 hover:bg-danger/5 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
          <p className="text-[12px] text-foreground-muted">
            Next billing: <strong className="text-foreground">{sub.nextBillingDate}</strong>
          </p>
        </div>
      )}

      {/* Cancel confirmation inline */}
      {showCancelConfirm && (
        <div className="px-6 py-4 bg-danger/5 border-t border-danger/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-danger">
                Cancel this subscription?
              </p>
              <p className="text-[12px] text-foreground-muted mt-0.5">
                You'll lose access at the end of your current billing period.
                Proration credit notes will be issued where applicable.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-3 py-1.5 rounded-md border border-border bg-surface text-[12px] font-medium text-foreground-muted hover:bg-muted transition-colors"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-3 py-1.5 rounded-md bg-danger text-danger-foreground text-[12px] font-medium hover:bg-danger/90 transition-colors"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubscriptionsPage() {
  const active = mockSubscriptions.filter(
    (s) => s.status === "active" || s.status === "trial"
  );
  const cancelled = mockSubscriptions.filter((s) => s.status === "cancelled");
  const totalMRR = mockSubscriptions
    .filter((s) => s.status === "active" && s.billingCycle === "monthly")
    .reduce((acc, s) => acc + s.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Subscriptions
          </h1>
          <p className="text-[13px] text-foreground-muted mt-1">
            Manage your recurring services and subscription plans.
          </p>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-surface border border-border shadow-sm">
          <div className="w-8 h-8 rounded-md bg-success/10 flex items-center justify-center">
            <RefreshCcw className="w-4 h-4 text-success" />
          </div>
          <div>
            <p className="text-[12px] text-foreground-muted font-medium">
              Monthly Recurring
            </p>
            <p className="text-[18px] font-bold text-foreground">
              {formatINR(totalMRR)}
            </p>
          </div>
        </div>
      </div>

      {/* Active */}
      {active.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-[13px] font-semibold text-foreground-muted uppercase tracking-wider">
            Active Subscriptions ({active.length})
          </h2>
          {active.map((sub) => (
            <SubscriptionCard key={sub.id} sub={sub} />
          ))}
        </div>
      )}

      {/* Cancelled */}
      {cancelled.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-[13px] font-semibold text-foreground-muted uppercase tracking-wider">
            Cancelled Subscriptions ({cancelled.length})
          </h2>
          {cancelled.map((sub) => (
            <SubscriptionCard key={sub.id} sub={sub} />
          ))}
        </div>
      )}
    </div>
  );
}
