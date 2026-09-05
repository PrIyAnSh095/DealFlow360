"use client";

import Link from "next/link";
import {
  FileText,
  ShoppingBag,
  Receipt,
  RefreshCcw,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  MessageSquareDiff,
} from "lucide-react";
import { mockQuotations, mockOrders, mockInvoices, mockSubscriptions } from "@/features/customer/mock-data";
import { cn } from "@/lib/utils";
import { ThemeSegmentedToggle } from "@/components/ui/theme-toggle";

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    sent: "bg-primary/10 text-primary border-primary/20",
    under_review: "bg-warning/10 text-warning border-warning/20",
    negotiating: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
    approved: "bg-success/10 text-success border-success/20",
    rejected: "bg-danger/10 text-danger border-danger/20",
    expired: "bg-muted text-foreground-muted border-border",
    confirmed: "bg-success/10 text-success border-success/20",
    processing: "bg-primary/10 text-primary border-primary/20",
    partially_shipped: "bg-warning/10 text-warning border-warning/20",
    shipped: "bg-primary/10 text-primary border-primary/20",
    delivered: "bg-success/10 text-success border-success/20",
    cancelled: "bg-danger/10 text-danger border-danger/20",
    paid: "bg-success/10 text-success border-success/20",
    active: "bg-success/10 text-success border-success/20",
    trial: "bg-warning/10 text-warning border-warning/20",
  };
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border capitalize",
        map[status] ?? "bg-muted text-foreground-muted border-border"
      )}
    >
      {label}
    </span>
  );
}

export default function CustomerDashboardPage() {
  const pendingNegotiations = mockQuotations.filter(
    (q) => q.negotiationRequests.filter((r) => r.status === "pending").length > 0
  );
  const overdueInvoices = mockInvoices.filter((i) => i.status === "overdue");
  const activeSubscriptions = mockSubscriptions.filter(
    (s) => s.status === "active"
  );
  const totalMonthlyRecurring = mockSubscriptions
    .filter((s) => s.status === "active" && s.billingCycle === "monthly")
    .reduce((acc, s) => acc + s.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back, Aryan 👋
          </h1>
          <p className="text-[13px] text-foreground-muted mt-1">
            Here's an overview of your quotes, orders, and subscriptions.
          </p>
        </div>

        {/* Theme Mode Toggle (White / Dark) */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <ThemeSegmentedToggle />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/portal/quotations"
          className="bg-surface border border-border rounded-lg p-4 shadow-sm hover:border-primary/30 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-foreground-muted group-hover:text-primary transition-colors" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {mockQuotations.length}
          </p>
          <p className="text-[12px] text-foreground-muted mt-0.5">
            Active Quotations
          </p>
        </Link>

        <Link
          href="/portal/orders"
          className="bg-surface border border-border rounded-lg p-4 shadow-sm hover:border-primary/30 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-md bg-warning/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-warning" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-foreground-muted group-hover:text-warning transition-colors" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {mockOrders.length}
          </p>
          <p className="text-[12px] text-foreground-muted mt-0.5">
            Open Orders
          </p>
        </Link>

        <Link
          href="/portal/invoices"
          className="bg-surface border border-border rounded-lg p-4 shadow-sm hover:border-primary/30 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-md bg-danger/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-danger" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-foreground-muted group-hover:text-danger transition-colors" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {mockInvoices.filter((i) => i.status === "sent" || i.status === "overdue").length}
          </p>
          <p className="text-[12px] text-foreground-muted mt-0.5">
            Invoices Due
          </p>
        </Link>

        <Link
          href="/portal/subscriptions"
          className="bg-surface border border-border rounded-lg p-4 shadow-sm hover:border-primary/30 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-md bg-success/10 flex items-center justify-center">
              <RefreshCcw className="w-5 h-5 text-success" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-foreground-muted group-hover:text-success transition-colors" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatINR(totalMonthlyRecurring)}
          </p>
          <p className="text-[12px] text-foreground-muted mt-0.5">
            Monthly Recurring
          </p>
        </Link>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Recent Quotations */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center">
              <h2 className="text-[15px] font-semibold text-foreground">
                Recent Quotations
              </h2>
              <Link
                href="/portal/quotations"
                className="text-[13px] font-medium text-primary hover:underline flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {mockQuotations.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-medium text-foreground truncate">
                        {q.title}
                      </p>
                      <StatusBadge status={q.status} />
                    </div>
                    <p className="text-[12px] text-foreground-muted mt-0.5">
                      {q.quotationNumber} · Valid until {q.validUntil}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-semibold text-foreground">
                      {formatINR(q.grandTotal)}
                    </p>
                    <Link
                      href={`/portal/quotations/${q.id}`}
                      className="text-[12px] text-primary hover:underline"
                    >
                      {q.status === "negotiating" ? "Negotiate →" : "View →"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center">
              <h2 className="text-[15px] font-semibold text-foreground">
                Recent Orders
              </h2>
              <Link
                href="/portal/orders"
                className="text-[13px] font-medium text-primary hover:underline flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {mockOrders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-foreground truncate">
                        {o.title}
                      </p>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="text-[12px] text-foreground-muted mt-0.5">
                      {o.orderNumber} · Placed {o.placedAt}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-semibold text-foreground">
                      {formatINR(o.total)}
                    </p>
                    <Link
                      href={`/portal/orders/${o.id}`}
                      className="text-[12px] text-primary hover:underline"
                    >
                      Track →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Alerts + Pending Items */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Action Required */}
          {pendingNegotiations.length > 0 && (
            <div className="bg-surface border border-border rounded-lg shadow-sm p-5">
              <h2 className="text-[15px] font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Action Required
              </h2>
              <div className="space-y-3">
                {pendingNegotiations.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20"
                  >
                    <MessageSquareDiff className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground">
                        Negotiation pending response
                      </p>
                      <p className="text-[12px] text-foreground-muted">
                        {q.quotationNumber} — {q.title}
                      </p>
                    </div>
                    <Link
                      href={`/portal/quotations/${q.id}`}
                      className="text-[12px] text-primary font-medium hover:underline shrink-0"
                    >
                      View →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Invoices */}
          <div className="bg-surface border border-border rounded-lg shadow-sm p-5">
            <h2 className="text-[15px] font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-foreground-muted" />
              Upcoming Invoices
            </h2>
            <div className="space-y-3">
              {mockInvoices
                .filter((i) => i.status === "sent" || i.status === "overdue")
                .map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-foreground truncate">
                        {inv.invoiceNumber}
                      </p>
                      <p className="text-[11px] text-foreground-muted">
                        Due {inv.dueDate}
                      </p>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p
                        className={cn(
                          "text-[13px] font-semibold",
                          inv.status === "overdue"
                            ? "text-danger"
                            : "text-foreground"
                        )}
                      >
                        {formatINR(inv.amount)}
                      </p>
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>
                ))}
            </div>
            <Link
              href="/portal/invoices"
              className="mt-4 text-[13px] font-medium text-primary hover:underline flex items-center gap-1"
            >
              View all invoices
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Active Subscriptions */}
          <div className="bg-surface border border-border rounded-lg shadow-sm p-5">
            <h2 className="text-[15px] font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Active Subscriptions
            </h2>
            <div className="space-y-3">
              {activeSubscriptions.map((sub) => (
                <div key={sub.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-foreground">
                      {sub.productName}
                    </p>
                    <p className="text-[13px] font-semibold text-foreground">
                      {formatINR(sub.amount)}/mo
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-1.5 rounded-full bg-primary transition-all"
                        style={{ width: `${sub.usagePercent ?? 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-foreground-muted shrink-0">
                      {sub.usagePercent ?? 0}%
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground-muted">
                    Renews {sub.nextBillingDate}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
