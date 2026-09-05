"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckSquare,
  Package,
  Receipt,
  RefreshCcw,
  FileX2,
  Clock,
  Eye,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  Boxes,
  CircleDollarSign,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/features/auth/auth-context";

// ─── Static mock data ────────────────────────────────────────────────────────

const highRiskAlerts = [
  {
    type: "approval",
    title: "High Risk Approval",
    ref: "Q-1024",
    company: "ABC Corp",
    detail: "Discount Risk: 18% — below margin floor",
    badge: "High Risk",
    badgeColor: "danger",
    action: "Review",
    href: "/approvals",
  },
  {
    type: "approval",
    title: "High Risk Approval",
    ref: "Q-1031",
    company: "Nexus Systems",
    detail: "Discount Risk: 21% — multiple product lines",
    badge: "High Risk",
    badgeColor: "danger",
    action: "Review",
    href: "/approvals",
  },
  {
    type: "backorder",
    title: "Backorder",
    ref: "O-1003",
    company: "Globex Ltd",
    detail: "10 x Dell Laptops pending — ETA unknown",
    badge: "Backorder",
    badgeColor: "warning",
    action: "View",
    href: "/operations",
  },
];

const pendingInvoices = [
  { id: "INV-2038", customer: "Acme Corp", amount: "84,500", due: "Sep 10", status: "Overdue" },
  { id: "INV-2039", customer: "Globex Ltd", amount: "1,20,000", due: "Sep 12", status: "Due Soon" },
  { id: "INV-2040", customer: "Initech", amount: "62,000", due: "Sep 15", status: "Pending" },
  { id: "INV-2041", customer: "Pinnacle Tech", amount: "38,200", due: "Sep 20", status: "Pending" },
];

const recentActivity = [
  { text: "Invoice INV-2041 generated for Acme Corp", time: "1h ago", color: "primary" },
  { text: "Approval Q-1022 approved by Finance", time: "3h ago", color: "success" },
  { text: "Backorder alert on O-1003 — laptops out of stock", time: "5h ago", color: "danger" },
  { text: "Subscription renewed for Initech — 12,000/mo", time: "Yesterday", color: "primary" },
  { text: "Credit note CN-112 issued to Pinnacle Tech", time: "Yesterday", color: "warning" },
];

const quickActions = [
  { label: "Process Pending Approvals", count: 5, href: "/approvals", color: "warning" },
  { label: "Fulfill Pending Orders", count: 12, href: "/operations", color: "primary" },
  { label: "Warehouse Split", count: 2, href: "/finance/warehouse-split", color: "primary" },
  { label: "Send Overdue Invoices", count: 1, href: "/invoices", color: "danger" },
  { label: "Review Backorders", count: 3, href: "/operations", color: "danger" },
  { label: "Manage Subscriptions", count: 24, href: "/subscriptions", color: "success" },
];

// ─── Color helpers ───────────────────────────────────────────────────────────

function getBg(color: string) {
  if (color === "primary") return "bg-primary/10";
  if (color === "success") return "bg-success/10";
  if (color === "warning") return "bg-warning/10";
  if (color === "danger") return "bg-danger/10";
  return "bg-muted";
}
function getText(color: string) {
  if (color === "primary") return "text-primary";
  if (color === "success") return "text-success";
  if (color === "warning") return "text-warning";
  if (color === "danger") return "text-danger";
  return "text-foreground";
}
function getBorder(color: string) {
  if (color === "primary") return "border-primary/20";
  if (color === "success") return "border-success/20";
  if (color === "warning") return "border-warning/20";
  if (color === "danger") return "border-danger/20";
  return "border-border";
}

const invoiceStatusStyle: Record<string, string> = {
  Overdue: "bg-danger/10 text-danger border-danger/20",
  "Due Soon": "bg-warning/10 text-warning border-warning/20",
  Pending: "bg-muted text-foreground-muted border-border",
};

// ─── Card data (using string icon names to avoid RenderProp issues) ───────────

const summaryCards = [
  { label: "Pending Approvals", value: 5, color: "warning", href: "/approvals", delta: "+2 since yesterday", deltaUp: false as boolean | null },
  { label: "Orders to Fulfill", value: 12, color: "primary", href: "/operations", delta: "4 due today", deltaUp: null },
  { label: "Backorders", value: 3, color: "danger", href: "/operations", delta: "Needs attention", deltaUp: false as boolean | null },
  { label: "Pending Invoices", value: 8, color: "warning", href: "/invoices", delta: "3.2L outstanding", deltaUp: null },
  { label: "Active Subscriptions", value: 24, color: "success", href: "/subscriptions", delta: "+3 this month", deltaUp: true as boolean | null },
  { label: "Credit Notes", value: 2, color: "danger", href: "/invoices", delta: "45K pending", deltaUp: null },
];

const cardIcons = [CheckSquare, Package, Boxes, Receipt, RefreshCcw, FileX2];

// ─── Page Component ──────────────────────────────────────────────────────────

export default function FinanceDashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "Manager";

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Finance &amp; Operations
          </h1>
          <p className="text-[13px] text-foreground-muted mt-1">
            Good morning, {firstName}. Here&apos;s your control center overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-foreground-muted bg-muted px-3 py-1.5 rounded-md border border-border">
            <Clock className="w-3.5 h-3.5" />
            Last updated: just now
          </span>
          <Link
            href="/approvals"
            className="flex items-center gap-1.5 text-[13px] font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors shadow-sm"
          >
            <CheckSquare className="w-4 h-4" />
            Approvals Queue
          </Link>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {summaryCards.map((card, idx) => {
          const Icon = cardIcons[idx];
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group bg-surface border border-border rounded-lg p-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-md ${getBg(card.color)} ${getBorder(card.color)} border flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${getText(card.color)}`} />
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider leading-none mb-1">
                  {card.label}
                </p>
                <p className={`text-2xl font-bold ${getText(card.color)}`}>{card.value}</p>
              </div>
              <p className="text-[11px] text-foreground-muted flex items-center gap-1">
                {card.deltaUp === true && <ArrowUpRight className="w-3 h-3 text-success" />}
                {card.deltaUp === false && <ArrowDownRight className="w-3 h-3 text-danger" />}
                {card.delta}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-3 flex flex-col gap-5">

          {/* Priority Alerts */}
          <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Priority Alerts
              </h2>
              <span className="text-[11px] bg-danger/10 text-danger border border-danger/20 px-2 py-0.5 rounded-full font-semibold">
                {highRiskAlerts.length} items
              </span>
            </div>
            <div className="divide-y divide-border">
              {highRiskAlerts.map((alert, i) => (
                <div key={i} className="px-5 py-4 flex items-start gap-4 hover:bg-muted/40 transition-colors">
                  <div className={`mt-0.5 w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${getBg(alert.badgeColor)} ${getBorder(alert.badgeColor)} border`}>
                    <ShieldAlert className={`w-4 h-4 ${getText(alert.badgeColor)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold text-foreground">{alert.title}</span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${getBg(alert.badgeColor)} ${getText(alert.badgeColor)} ${getBorder(alert.badgeColor)} border`}>
                        {alert.badge}
                      </span>
                    </div>
                    <p className="text-[13px] font-medium text-foreground mt-0.5">
                      Quote <span className="text-primary">{alert.ref}</span> | {alert.company}
                    </p>
                    <p className="text-[12px] text-foreground-muted mt-0.5">{alert.detail}</p>
                  </div>
                  <Link
                    href={alert.href}
                    className="shrink-0 text-[12px] font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/15 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {alert.action}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Invoices Table */}
          <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-foreground flex items-center gap-2">
                <Receipt className="w-4 h-4 text-foreground-muted" />
                Pending Invoices
              </h2>
              <Link href="/invoices" className="text-[12px] font-medium text-primary hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">
                    <th className="px-5 py-3 font-medium">Invoice</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium text-right">Amount</th>
                    <th className="px-5 py-3 font-medium text-center">Due Date</th>
                    <th className="px-5 py-3 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] divide-y divide-border">
                  {pendingInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3 font-medium text-primary">{inv.id}</td>
                      <td className="px-5 py-3 text-foreground">{inv.customer}</td>
                      <td className="px-5 py-3 text-right font-medium text-foreground">{inv.amount}</td>
                      <td className="px-5 py-3 text-center text-foreground-muted">{inv.due}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${invoiceStatusStyle[inv.status]}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Revenue Overview */}
          <div className="bg-surface border border-border rounded-lg shadow-sm p-5">
            <h2 className="text-[14px] font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-foreground-muted" />
              Revenue Overview
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span className="text-foreground-muted font-medium">Collected This Month</span>
                  <span className="font-semibold text-foreground">8.4L</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-success h-1.5 rounded-full" style={{ width: "70%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span className="text-foreground-muted font-medium">Outstanding Invoices</span>
                  <span className="font-semibold text-warning">3.2L</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-warning h-1.5 rounded-full" style={{ width: "27%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span className="text-foreground-muted font-medium">Credit Notes Issued</span>
                  <span className="font-semibold text-danger">45K</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-danger h-1.5 rounded-full" style={{ width: "4%" }} />
                </div>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-border grid grid-cols-2 gap-3">
              <div className="bg-muted rounded-md px-3 py-2.5">
                <p className="text-[11px] text-foreground-muted uppercase tracking-wider font-medium">MRR</p>
                <p className="text-[18px] font-bold text-foreground mt-0.5">2.88L</p>
              </div>
              <div className="bg-muted rounded-md px-3 py-2.5">
                <p className="text-[11px] text-foreground-muted uppercase tracking-wider font-medium">Pipeline</p>
                <p className="text-[18px] font-bold text-foreground mt-0.5">24.6L</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-surface border border-border rounded-lg shadow-sm p-5">
            <h2 className="text-[14px] font-semibold text-foreground mb-3 flex items-center gap-2">
              <CircleDollarSign className="w-4 h-4 text-foreground-muted" />
              Quick Actions
            </h2>
            <div className="space-y-2">
              {quickActions.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-md border border-border hover:border-primary/30 hover:bg-muted/60 transition-all group"
                >
                  <span className="text-[13px] text-foreground font-medium group-hover:text-primary transition-colors">
                    {item.label}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${getBg(item.color)} ${getText(item.color)} ${getBorder(item.color)} border`}>
                    {item.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-surface border border-border rounded-lg shadow-sm p-5">
            <h2 className="text-[14px] font-semibold text-foreground mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    item.color === "primary" ? "bg-primary" :
                    item.color === "success" ? "bg-success" :
                    item.color === "warning" ? "bg-warning" :
                    item.color === "danger" ? "bg-danger" : "bg-muted"
                  }`} />
                  <div>
                    <p className="text-[13px] text-foreground leading-snug">{item.text}</p>
                    <p className="text-[11px] text-foreground-muted mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
