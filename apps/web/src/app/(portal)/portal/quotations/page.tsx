"use client";

import Link from "next/link";
import { FileText, Search, Filter, ChevronRight, Clock, MessageSquareDiff } from "lucide-react";
import { mockQuotations } from "@/features/customer/mock-data";
import { cn } from "@/lib/utils";
import { useState } from "react";

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

const STATUS_COLORS: Record<string, string> = {
  sent: "bg-primary/10 text-primary border-primary/20",
  under_review: "bg-warning/10 text-warning border-warning/20",
  negotiating: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-danger/10 text-danger border-danger/20",
  expired: "bg-muted text-foreground-muted border-border",
};

export default function MyQuotationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockQuotations.filter((q) => {
    const matchSearch =
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.quotationNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            My Quotations
          </h1>
          <p className="text-[13px] text-foreground-muted mt-1">
            View all quotations sent to you. Negotiate or confirm directly.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search by name or number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-surface border border-border rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "sent", "negotiating", "approved", "rejected"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[12px] font-medium border transition-colors capitalize",
                  statusFilter === status
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-surface border-border text-foreground-muted hover:text-foreground hover:bg-muted"
                )}
              >
                {status === "all" ? "All" : status.replace(/_/g, " ")}
              </button>
            )
          )}
        </div>
      </div>

      {/* Quotation cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg p-12 text-center">
            <FileText className="w-10 h-10 text-foreground-muted mx-auto mb-3" />
            <p className="text-[14px] font-medium text-foreground">
              No quotations found
            </p>
            <p className="text-[13px] text-foreground-muted mt-1">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          filtered.map((q) => {
            const pendingRequests = q.negotiationRequests.filter(
              (r) => r.status === "pending"
            ).length;

            return (
              <div
                key={q.id}
                className="bg-surface border border-border rounded-lg shadow-sm hover:border-primary/30 hover:shadow-md transition-all"
              >
                {/* Card Header */}
                <div className="px-6 py-4 border-b border-border flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[15px] font-semibold text-foreground">
                          {q.title}
                        </h3>
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border capitalize",
                            STATUS_COLORS[q.status] ??
                              "bg-muted text-foreground-muted border-border"
                          )}
                        >
                          {q.status.replace(/_/g, " ")}
                        </span>
                        {pendingRequests > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-warning/10 text-warning border border-warning/20">
                            <MessageSquareDiff className="w-3 h-3" />
                            {pendingRequests} negotiation pending
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-foreground-muted mt-1">
                        {q.quotationNumber} · Prepared by {q.salesRep} · Created {q.createdAt}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[20px] font-bold text-foreground">
                      {formatINR(q.grandTotal)}
                    </p>
                    <p className="text-[12px] text-foreground-muted">
                      After {formatINR(q.totalDiscount)} discount
                    </p>
                  </div>
                </div>

                {/* Line items preview */}
                <div className="px-6 py-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wider border-b border-border">
                          <th className="pb-2 pr-4">Product</th>
                          <th className="pb-2 pr-4 text-center">Qty</th>
                          <th className="pb-2 pr-4 text-right">Unit Price</th>
                          <th className="pb-2 pr-4 text-center">Discount</th>
                          <th className="pb-2 text-right">Final Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {q.lineItems.map((item) => (
                          <tr key={item.id} className="text-[13px]">
                            <td className="py-2 pr-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">
                                  {item.productName}
                                </span>
                                <span
                                  className={cn(
                                    "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium capitalize",
                                    item.productType === "hardware"
                                      ? "bg-primary/10 text-primary"
                                      : item.productType === "service"
                                      ? "bg-warning/10 text-warning"
                                      : "bg-success/10 text-success"
                                  )}
                                >
                                  {item.productType}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 pr-4 text-center text-foreground-muted">
                              {item.qty}
                            </td>
                            <td className="py-2 pr-4 text-right text-foreground-muted">
                              {formatINR(item.unitPrice)}
                            </td>
                            <td className="py-2 pr-4 text-center">
                              {item.discount > 0 ? (
                                <span className="text-success font-medium">
                                  {item.discount}%
                                </span>
                              ) : (
                                <span className="text-foreground-muted">—</span>
                              )}
                            </td>
                            <td className="py-2 text-right font-semibold text-foreground">
                              {formatINR(item.finalPrice)}
                              {item.isRecurring && (
                                <span className="text-[11px] text-foreground-muted font-normal">
                                  /mo
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[12px] text-foreground-muted">
                    <Clock className="w-3.5 h-3.5" />
                    Valid until {q.validUntil}
                  </div>
                  <Link
                    href={`/portal/quotations/${q.id}`}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    {q.status === "negotiating"
                      ? "Continue Negotiation"
                      : q.status === "approved"
                      ? "View & Confirm"
                      : "View & Negotiate"}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
