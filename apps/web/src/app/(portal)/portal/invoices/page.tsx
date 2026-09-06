"use client";

import { useState, useEffect } from "react";
import {
  Receipt,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileX,
  CreditCard,
  TrendingDown,
} from "lucide-react";
import { customerApi } from "@/features/customer/api";
import { cn } from "@/lib/utils";

function formatINR(value: number) {
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(abs);
  return value < 0 ? `− ${formatted}` : formatted;
}

const STATUS_META: Record<
  string,
  { color: string; icon: React.ReactNode; label: string }
> = {
  paid: {
    color: "bg-success/10 text-success border-success/20",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    label: "Paid",
  },
  sent: {
    color: "bg-primary/10 text-primary border-primary/20",
    icon: <Clock className="w-3.5 h-3.5" />,
    label: "Due",
  },
  overdue: {
    color: "bg-danger/10 text-danger border-danger/20",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    label: "Overdue",
  },
  draft: {
    color: "bg-muted text-foreground-muted border-border",
    icon: <Receipt className="w-3.5 h-3.5" />,
    label: "Draft",
  },
  void: {
    color: "bg-muted text-foreground-muted border-border",
    icon: <FileX className="w-3.5 h-3.5" />,
    label: "Void / Credit",
  },
};

export default function InvoicesPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    customerApi.getInvoices().then(setInvoices).finally(() => setIsLoading(false));
  }, []);

  const filtered = invoices.filter((inv) => {
    const matchStatus = filter === "all" || inv.status === filter;
    const matchSearch =
      !search ||
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.description?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalDue = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((acc, i) => acc + i.amount, 0);

  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((acc, i) => acc + i.amount, 0);

  const creditNotes = invoices.filter(
    (i) => i.isProratedOrCreditNote && i.amount < 0
  );
  const totalCredit = creditNotes.reduce((acc, i) => acc + i.amount, 0);

  if (isLoading) {
    return <div className="p-8 text-[13px] text-foreground-muted flex items-center justify-center h-[60vh]">Loading invoices...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Invoices & Billing
        </h1>
        <p className="text-[13px] text-foreground-muted mt-1">
          View all your invoices, credit notes, and payment history.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-danger/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-danger" />
            </div>
            <p className="text-[12px] font-semibold text-foreground-muted uppercase tracking-wider">
              Amount Due
            </p>
          </div>
          <p className="text-2xl font-bold text-danger">
            {formatINR(totalDue)}
          </p>
          <p className="text-[12px] text-foreground-muted mt-1">
            Across {invoices.filter((i) => i.status === "sent" || i.status === "overdue").length} invoices
          </p>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <p className="text-[12px] font-semibold text-foreground-muted uppercase tracking-wider">
              Total Paid
            </p>
          </div>
          <p className="text-2xl font-bold text-success">
            {formatINR(totalPaid)}
          </p>
          <p className="text-[12px] text-foreground-muted mt-1">
            Across {invoices.filter((i) => i.status === "paid").length} invoices
          </p>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-warning/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-warning" />
            </div>
            <p className="text-[12px] font-semibold text-foreground-muted uppercase tracking-wider">
              Credits
            </p>
          </div>
          <p className="text-2xl font-bold text-warning">
            {formatINR(Math.abs(totalCredit))}
          </p>
          <p className="text-[12px] text-foreground-muted mt-1">
            {creditNotes.length} credit note{creditNotes.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-2.5 top-2 h-4 w-4 text-foreground-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by invoice # or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-surface border border-border rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "sent", "paid", "overdue", "void"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "px-3 py-1.5 rounded-md text-[12px] font-medium border transition-colors capitalize",
              filter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-surface border-border text-foreground-muted hover:text-foreground hover:bg-muted"
            )}
          >
            {s === "all" ? "All" : s}
          </button>
        ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">
                <th className="px-6 py-3">Invoice #</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Issued</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-[13px]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-foreground-muted">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => {
                  const meta = STATUS_META[inv.status] ?? STATUS_META["draft"];
                  const isCredit = inv.amount < 0;

                  return (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isCredit ? (
                            <TrendingDown className="w-4 h-4 text-warning shrink-0" />
                          ) : (
                            <Receipt className="w-4 h-4 text-foreground-muted shrink-0" />
                          )}
                          <span className="font-mono font-semibold text-foreground">
                            {inv.invoiceNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground-muted max-w-[250px]">
                        <p className="truncate">{inv.description}</p>
                        {inv.isProratedOrCreditNote && (
                          <span className="mt-0.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning/10 text-warning border border-warning/20">
                            Credit Note
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-foreground-muted">
                        {inv.issuedAt}
                      </td>
                      <td className="px-6 py-4 text-foreground-muted">
                        {inv.dueDate}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={cn(
                            "font-bold text-[14px]",
                            isCredit
                              ? "text-warning"
                              : inv.status === "overdue"
                              ? "text-danger"
                              : "text-foreground"
                          )}
                        >
                          {formatINR(inv.amount)}
                        </span>
                        {inv.paidAt && (
                          <p className="text-[11px] text-success mt-0.5">
                            Paid {inv.paidAt}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border",
                            meta.color
                          )}
                        >
                          {meta.icon}
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {(inv.status === "sent" || inv.status === "overdue") && (
                            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 transition-colors">
                              <CreditCard className="w-3.5 h-3.5" />
                              Pay Now
                            </button>
                          )}
                          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-surface text-[12px] font-medium text-foreground-muted hover:text-foreground hover:bg-muted transition-colors">
                            <Download className="w-3.5 h-3.5" />
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
