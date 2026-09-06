"use client";

import { useState } from "react";
import { useNegotiations, useRespondNegotiation } from "@/features/deals/hooks";
import { NegotiationItem } from "@/features/deals/types";
import {
  MessageSquare,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  ArrowRight,
  Filter,
  DollarSign,
  Percent,
  X,
  Send,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function NegotiationsPage() {
  const { data: rawNegotiations, isLoading, error } = useNegotiations();
  const { mutate: respond, isPending: isResponding } = useRespondNegotiation();

  const [activeTab, setActiveTab] = useState<string>("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<NegotiationItem | null>(null);
  const [responseMsg, setResponseMsg] = useState("");
  const [counterDiscount, setCounterDiscount] = useState<string>("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const negotiations: NegotiationItem[] = rawNegotiations || [];

  const pendingItems = negotiations.filter(
    (n) => n.status === "PENDING_REP_RESPONSE" || n.status === "CUSTOMER" || n.status === "PENDING"
  );
  const totalValueAtRisk = pendingItems.reduce((acc, curr) => acc + (curr.quote_total || 0), 0);
  const avgMargin = pendingItems.length
    ? pendingItems.reduce((acc, curr) => acc + (curr.quote_margin || 0), 0) / pendingItems.length
    : 0;

  const filteredNegotiations = negotiations.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      (item.customer_name && item.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.quotation_id && item.quotation_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.content && item.content.toLowerCase().includes(searchQuery.toLowerCase()));

    const statusUpper = (item.status || "").toUpperCase();
    let matchesTab = true;

    if (activeTab === "PENDING") {
      matchesTab = statusUpper.includes("PENDING") || statusUpper === "CUSTOMER";
    } else if (activeTab === "COUNTERED") {
      matchesTab = statusUpper.includes("COUNTER") || statusUpper.includes("REP");
    } else if (activeTab === "ACCEPTED") {
      matchesTab = statusUpper.includes("ACCEPT") || statusUpper.includes("APPROVED") || statusUpper === "WON";
    } else if (activeTab === "REJECTED") {
      matchesTab = statusUpper.includes("REJECT") || statusUpper === "LOST";
    }

    return matchesSearch && matchesTab;
  });

  const handleAction = (actionType: "ACCEPT" | "COUNTER" | "REJECT") => {
    if (!selectedItem) return;

    const discountNum = counterDiscount ? parseFloat(counterDiscount) : undefined;
    setActionError(null);

    respond(
      {
        messageId: selectedItem.id,
        payload: {
          action: actionType,
          message: responseMsg || undefined,
          counter_discount_pct: discountNum,
        },
      },
      {
        onSuccess: (res: any) => {
          setActionSuccess(res?.message || `Successfully responded with ${actionType}`);
          setSelectedItem(null);
          setResponseMsg("");
          setCounterDiscount("");
          setTimeout(() => setActionSuccess(null), 5000);
        },
        onError: (err: any) => {
          setActionError(err?.response?.data?.detail || "Failed to process negotiation action.");
        },
      }
    );
  };

  if (error) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-lg text-[13px]">
          Failed to load negotiations inbox. Please check backend connection.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Customer Negotiations
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Review customer discount requests, counter-offers, and negotiation responses in a dedicated workspace.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/deals"
            className="px-3 py-1.5 rounded-md border border-border bg-surface text-foreground-muted hover:text-foreground hover:bg-muted text-[13px] font-medium transition-colors"
          >
            ← Back to Pipeline
          </Link>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-lg p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Pending Action</p>
            <p className="text-2xl font-bold text-foreground mt-1">{pendingItems.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-warning/10 border border-warning/20 flex items-center justify-center text-warning">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Value Under Negotiation</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              ₹{totalValueAtRisk.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Avg Margin (Pending)</p>
            <p className={`text-2xl font-bold mt-1 ${avgMargin < 15 ? 'text-danger' : 'text-success'}`}>
              {avgMargin.toFixed(1)}%
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-success/10 border border-success/20 flex items-center justify-center text-success">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: "PENDING", label: `Pending (${pendingItems.length})` },
            { id: "COUNTERED", label: "Counter Offered" },
            { id: "ACCEPTED", label: "Accepted" },
            { id: "REJECTED", label: "Rejected" },
            { id: "ALL", label: "All Records" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-surface text-foreground-muted hover:bg-muted border border-border"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search customer or quote..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-surface border border-border rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Success Banner */}
      {actionSuccess && (
        <div className="bg-success/10 border border-success/30 text-success rounded-lg p-3 text-[13px] font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {actionSuccess}
        </div>
      )}

      {/* Main Table List */}
      <div className="bg-surface border border-border rounded-lg shadow-sm flex-1 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-[13px] text-foreground-muted">
            Loading customer negotiations...
          </div>
        ) : filteredNegotiations.length === 0 ? (
          <div className="p-12 text-center text-foreground-muted text-[13px] space-y-2">
            <CheckCircle2 className="w-8 h-8 text-success/50 mx-auto" />
            <p className="font-semibold text-foreground">No negotiations in this view.</p>
            <p className="text-[12px]">All customer price requests have been handled.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-muted/60 text-foreground-muted border-b border-border uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Customer & Deal</th>
                  <th className="px-5 py-3.5">Quotation</th>
                  <th className="px-5 py-3.5">Customer Request / Note</th>
                  <th className="px-5 py-3.5 text-right">Quote Value</th>
                  <th className="px-5 py-3.5 text-right">Margin</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredNegotiations.map((item) => {
                  const statusUpper = (item.status || "PENDING").toUpperCase();
                  const isPending = statusUpper.includes("PENDING") || statusUpper === "CUSTOMER";
                  const isApproved = statusUpper.includes("ACCEPT") || statusUpper.includes("APPROVED");
                  const isRejected = statusUpper.includes("REJECT");

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-foreground">{item.customer_name || "Customer"}</p>
                        <p className="text-[11px] text-foreground-muted">{item.deal_name || `Deal ${item.deal_id?.slice(0, 8)}`}</p>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[12px] text-foreground">
                        {item.quotation_id ? item.quotation_id.slice(0, 8) : "N/A"}
                      </td>
                      <td className="px-5 py-3.5 text-foreground max-w-xs">
                        <p className="line-clamp-2 italic text-[12px]">"{item.content || "Discount request submitted"}"</p>
                        {item.counter_discount_pct && (
                          <span className="inline-block mt-1 text-[11px] font-semibold text-primary">
                            Req Discount: {item.counter_discount_pct}%
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium">
                        ₹{(item.quote_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`font-bold ${item.quote_margin < 15 ? 'text-danger' : 'text-success'}`}>
                          {(item.quote_margin || 0).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                          isPending ? "bg-warning/10 text-warning border-warning/20" :
                          isApproved ? "bg-success/10 text-success border-success/20" :
                          isRejected ? "bg-danger/10 text-danger border-danger/20" :
                          "bg-primary/10 text-primary border-primary/20"
                        }`}>
                          {isPending && <Clock className="w-3 h-3" />}
                          {isApproved && <CheckCircle2 className="w-3 h-3" />}
                          {isRejected && <XCircle className="w-3 h-3" />}
                          {statusUpper}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isPending ? (
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setCounterDiscount(item.counter_discount_pct ? String(item.counter_discount_pct) : "12");
                            }}
                            className="px-3 py-1 bg-primary text-primary-foreground rounded text-[12px] font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                          >
                            Respond
                          </button>
                        ) : (
                          <span className="text-[11px] text-foreground-muted">Logged</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Response Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Respond to {selectedItem.customer_name}
                </h3>
                <p className="text-[11px] text-foreground-muted">Quote ID: {selectedItem.quotation_id}</p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 text-foreground-muted hover:text-foreground rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-danger/10 border border-danger/30 text-danger text-[12px] font-medium rounded">
                {actionError}
              </div>
            )}

            <div className="space-y-4 text-[13px]">
              <div className="bg-muted/40 p-3 rounded-lg border border-border/60">
                <p className="text-foreground-muted text-[12px]">
                  <strong className="text-foreground">Customer Message:</strong> "{selectedItem.content}"
                </p>
                <div className="flex items-center gap-4 mt-2 text-[11px] text-foreground-muted pt-2 border-t border-border/40">
                  <span>Quote Value: <strong>₹{(selectedItem.quote_total || 0).toLocaleString()}</strong></span>
                  <span>Margin: <strong className={selectedItem.quote_margin < 15 ? "text-danger" : "text-success"}>{(selectedItem.quote_margin || 0).toFixed(1)}%</strong></span>
                </div>
              </div>

              <div>
                <label className="block text-foreground font-semibold mb-1">
                  Proposed Discount Percentage (%)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 12.0"
                  value={counterDiscount}
                  onChange={(e) => setCounterDiscount(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px] font-bold focus:ring-2 focus:ring-primary/30"
                />
                <p className="text-[11px] text-foreground-muted mt-1">
                  * Counter-offers breaching discount thresholds will automatically trigger manager approval workflow.
                </p>
              </div>

              <div>
                <label className="block text-foreground font-semibold mb-1">
                  Response Message to Customer
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain counter offer terms or confirmation notes..."
                  value={responseMsg}
                  onChange={(e) => setResponseMsg(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  disabled={isResponding}
                  onClick={() => handleAction("REJECT")}
                  className="px-3.5 py-1.5 bg-danger/10 text-danger border border-danger/20 rounded-md font-medium text-[12px] hover:bg-danger/20 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  disabled={isResponding}
                  onClick={() => handleAction("COUNTER")}
                  className="px-3.5 py-1.5 bg-warning/10 text-warning border border-warning/20 rounded-md font-medium text-[12px] hover:bg-warning/20 transition-colors disabled:opacity-50"
                >
                  Counter Offer
                </button>
                <button
                  disabled={isResponding}
                  onClick={() => handleAction("ACCEPT")}
                  className="px-4 py-1.5 bg-primary text-primary-foreground rounded-md font-semibold text-[12px] hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
                >
                  Accept Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
