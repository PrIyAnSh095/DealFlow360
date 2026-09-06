"use client";

import { useEffect, useState } from "react";
import { quotationsApi } from "@/features/quotations/api";
import { QuotationResponse } from "@/features/quotations/types";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { useAuth } from "@/features/auth/auth-context";

export default function QuotationsPage() {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState<QuotationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const canCreate = user && ["sales_rep", "admin"].includes(user.role);

  useEffect(() => {
    quotationsApi.getQuotations()
      .then(setQuotations)
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredQuotations = quotations.filter((quote) => {
    const matchesSearch =
      !searchQuery ||
      quote.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.deal_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (quote.customer_name && quote.customer_name.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
          
          {canCreate && (
            <Link href="/quotations/new" className="flex items-center justify-center rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-[13px] font-medium hover:bg-primary/90 transition-colors shadow-sm ml-1">
              <Plus className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">New Quote</span>
            </Link>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-surface border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-96 text-foreground-muted text-[13px]">
            Loading quotations...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-96 text-danger text-[13px]">
            Failed to load quotations.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-[12px] font-semibold text-foreground-muted uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Quote ID</th>
                  <th className="px-5 py-3 font-medium">Deal ID</th>
                  <th className="px-5 py-3 font-medium text-right">Value</th>
                  <th className="px-5 py-3 font-medium text-right">Margin</th>
                  <th className="px-5 py-3 font-medium text-center">Risk</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-[13px] divide-y divide-border">
                {filteredQuotations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-foreground-muted">
                      No quotations found.
                    </td>
                  </tr>
                ) : (
                  filteredQuotations.map((quote) => {
                    const isHighRisk = (quote.risk_score || "").toUpperCase() === 'HIGH';
                    const isMedRisk = (quote.risk_score || "").toUpperCase() === 'MEDIUM';
                    const quoteIdStr = (quote.id || "").slice(0, 6);
                    const dealIdStr = (quote.deal_id || "").slice(0, 6);
                    const totalVal = ((Number(quote.total) || 0) / 1000).toFixed(1);
                    const marginVal = (Number(quote.margin_percentage) || 0).toFixed(1);
                    
                    return (
                      <>
                      <tr key={quote.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-foreground">QT-{quoteIdStr}</td>
                        <td className="px-5 py-3 text-foreground-muted">Deal {dealIdStr}</td>
                        <td className="px-5 py-3 text-right font-medium text-foreground">
                          ₹{totalVal}k
                        </td>
                        <td className="px-5 py-3 text-right font-medium">
                          {marginVal}%
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border",
                            isHighRisk ? "bg-danger/10 text-danger border-danger/20" : 
                            isMedRisk ? "bg-warning/10 text-warning border-warning/20" : 
                            "bg-success/10 text-success border-success/20"
                          )}>
                            {isHighRisk ? 'High' : isMedRisk ? 'Med' : 'Low'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-foreground-muted capitalize">
                          {quote.status || 'draft'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link href={`/deals/${quote.deal_id || ''}`} className="text-primary font-medium hover:underline">
                            Open
                          </Link>
                        </td>
                      </tr>
                      <tr key={`${quote.id}-lines`} className="bg-muted/20">
                        <td colSpan={7} className="px-5 py-2">
                          {quote.lines?.length ? (
                            <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-foreground-muted">
                              {quote.lines.map((line) => (
                                <span key={`${quote.id}-${line.product_id}`}>
                                  {line.product_name} x{line.quantity} | {Number(line.discount_percent || 0).toFixed(1)}% discount
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[12px] text-foreground-muted">No products added.</span>
                          )}
                        </td>
                      </tr>
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
