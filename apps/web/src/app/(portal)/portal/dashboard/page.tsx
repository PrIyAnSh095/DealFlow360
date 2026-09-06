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
import { useEffect, useState } from "react";
import { customerApi, CustomerQuotation, CustomerOrder } from "@/features/customer/api";
import { useOrgConfig, formatCurrency } from "@/features/customer/useOrgConfig";
import { cn } from "@/lib/utils";


function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING_APPROVAL: "bg-warning/10 text-warning border-warning/20",
    APPROVED: "bg-success/10 text-success border-success/20",
    SENT: "bg-primary/10 text-primary border-primary/20",
    NEGOTIATION: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
    ACCEPTED: "bg-success/10 text-success border-success/20",
    REJECTED: "bg-danger/10 text-danger border-danger/20",
    pending_fulfillment: "bg-warning/10 text-warning border-warning/20",
    fulfilled: "bg-success/10 text-success border-success/20",
  };
  const label = status.replace(/_/g, " ").toLowerCase();
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
  const orgConfig = useOrgConfig();
  const [quotations, setQuotations] = useState<CustomerQuotation[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      customerApi.getQuotations(),
      customerApi.getOrders(),
      customerApi.getInvoices(),
      customerApi.getSubscriptions()
    ]).then(([qData, oData, iData, sData]) => {
      setQuotations(qData);
      setOrders(oData);
      setInvoices(iData);
      setSubscriptions(sData);
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const pendingNegotiations = quotations.filter((q) => q.status === "NEGOTIATION");
  const overdueInvoices = invoices.filter((i) => i.status === "UNPAID" || i.status === "overdue" || i.status === "pending");
  const activeSubscriptions = subscriptions.filter((s) => s.status === "ACTIVE" || s.status === "active");
  const totalMonthlyRecurring = activeSubscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0);

  if (isLoading) {
    return <div className="p-8 text-[13px] text-foreground-muted flex items-center justify-center h-full">Loading portal...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back 👋
          </h1>
          <p className="text-[13px] text-foreground-muted mt-1">
            Here's an overview of your quotes, orders, and subscriptions.
          </p>
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
            {quotations.length}
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
            {orders.length}
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
            {overdueInvoices.length}
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
            {formatCurrency(totalMonthlyRecurring, orgConfig)}
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
              {quotations.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-medium text-foreground truncate">
                        {q.deal_name}
                      </p>
                      <StatusBadge status={q.status} />
                    </div>
                    <p className="text-[12px] text-foreground-muted mt-0.5">
                      {q.id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-semibold text-foreground">
                      {formatCurrency(q.total, orgConfig)}
                    </p>
                    <Link
                      href={`/portal/quotations/${q.id}`}
                      className="text-[12px] text-primary hover:underline"
                    >
                      {q.status === "NEGOTIATION" ? "Negotiate →" : "View →"}
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
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-foreground truncate">
                        {o.deal_name}
                      </p>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="text-[12px] text-foreground-muted mt-0.5">
                      {o.id.slice(0, 8)} · Placed {new Date(o.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
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
                        {q.id.slice(0,8)} — {q.deal_name}
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
              {overdueInvoices
                .map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-foreground truncate">
                        {inv.invoice_number || inv.id.slice(0,8)}
                      </p>
                      <p className="text-[11px] text-foreground-muted">
                        Due {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p
                        className={cn(
                          "text-[13px] font-semibold",
                          inv.status === "overdue" || inv.status === "UNPAID"
                            ? "text-danger"
                            : "text-foreground"
                        )}
                      >
                        {formatCurrency(inv.amount, orgConfig)}
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
                      {sub.product_name || "Subscription"}
                    </p>
                    <p className="text-[13px] font-semibold text-foreground">
                      {formatCurrency(sub.amount, orgConfig)}/mo
                    </p>
                  </div>
                  {sub.usagePercent !== undefined ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-1.5 rounded-full bg-primary transition-all"
                          style={{ width: `${sub.usagePercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-foreground-muted shrink-0">
                        {sub.usagePercent}%
                      </span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-foreground-muted italic">Usage data unavailable</p>
                  )}
                  <p className="text-[11px] text-foreground-muted">
                    Renews {sub.next_billing_date ? new Date(sub.next_billing_date).toLocaleDateString() : 'Next Month'}
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
