"use client";

import { useEffect, useState } from "react";
import { quotationsApi } from "@/features/quotations/api";
import { QuotationResponse } from "@/features/quotations/types";
import { FileText, Plus, Search, Filter, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { QuotationCard } from "@/components/QuotationCard";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<QuotationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    quotationsApi.getQuotations()
      .then(setQuotations)
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredQuotes = quotations.filter((q) => 
    q.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.customer_name && q.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Quotations
          </h1>
          <p className="text-[13px] text-foreground-muted mt-1">
            Manage your draft and active quotes.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block w-64">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search quotes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-surface border border-border rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
          
          <div className="flex items-center rounded-md border border-border bg-surface p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded text-[12px] font-medium transition-colors flex items-center gap-1",
                viewMode === "grid" ? "bg-primary text-primary-foreground font-bold shadow-xs" : "text-foreground-muted hover:text-foreground"
              )}
              title="Grid View (Quotation Cards)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1.5 rounded text-[12px] font-medium transition-colors flex items-center gap-1",
                viewMode === "table" ? "bg-primary text-primary-foreground font-bold shadow-xs" : "text-foreground-muted hover:text-foreground"
              )}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <Link href="/quotations/new" className="flex items-center justify-center rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-[13px] font-medium hover:bg-primary/90 transition-colors shadow-sm ml-1">
            <Plus className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">New Quote</span>
          </Link>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-96 text-foreground-muted text-[13px]">
            Loading quotations from PostgreSQL...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-96 text-danger text-[13px]">
            Failed to load quotations from backend API.
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="flex items-center justify-center h-96 text-foreground-muted text-[13px]">
            No quotations found matching criteria.
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View displaying dynamic QuotationCards with top-right ⓘ AI button */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredQuotes.map((quote) => (
              <QuotationCard
                key={quote.id}
                id={quote.id}
                dealId={quote.deal_id}
                customerName={quote.customer_name || "Customer"}
                status={quote.status}
                subtotal={quote.subtotal}
                totalDiscount={quote.total_discount}
                total={quote.total}
                marginPercentage={quote.margin_percentage}
                riskScore={quote.risk_score}
                requiresApproval={quote.requires_approval}
                productsCount={quote.lines ? quote.lines.length : 1}
              />
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-[12px] font-semibold text-foreground-muted uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Quote ID</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium text-right">Value</th>
                  <th className="px-5 py-3 font-medium text-right">Margin</th>
                  <th className="px-5 py-3 font-medium text-center">Risk</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-[13px] divide-y divide-border">
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">QT-{quote.id.slice(0, 8)}</td>
                    <td className="px-5 py-3 text-foreground font-semibold">{quote.customer_name || "Customer"}</td>
                    <td className="px-5 py-3 text-right font-medium text-foreground">
                      ₹{(quote.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 text-right font-medium">
                      {(quote.margin_percentage || 0).toFixed(1)}%
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border uppercase tracking-wider",
                        quote.risk_score === 'HIGH' ? "bg-danger/10 text-danger border-danger/20" : 
                        quote.risk_score === 'MEDIUM' ? "bg-warning/10 text-warning border-warning/20" : 
                        "bg-success/10 text-success border-success/20"
                      )}>
                        {quote.risk_score}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-foreground-muted capitalize">
                      {quote.status}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/quotations/${quote.id}`} className="text-primary font-medium hover:underline">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
