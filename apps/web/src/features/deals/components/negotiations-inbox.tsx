"use client";

import { useState } from "react";
import { useNegotiations, useRespondNegotiation } from "../hooks";
import { NegotiationItem } from "../types";
import { MessageSquare, AlertCircle, CheckCircle2, XCircle, Send } from "lucide-react";

export function NegotiationsInbox() {
  const { data: rawNegotiations, isLoading } = useNegotiations();
  const { mutate: respond, isPending } = useRespondNegotiation();

  const negotiations: NegotiationItem[] = rawNegotiations || [];
  const pendingItems = negotiations.filter((n) => n.status === "PENDING_REP_RESPONSE" || n.status === "CUSTOMER");

  const [selectedItem, setSelectedItem] = useState<NegotiationItem | null>(null);
  const [responseMsg, setResponseMsg] = useState("");
  const [counterDiscount, setCounterDiscount] = useState<string>("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="p-4 bg-surface border border-border rounded-lg text-[13px] text-foreground-muted">
        Loading pending customer negotiations...
      </div>
    );
  }

  if (pendingItems.length === 0) {
    return null; // Hide box when no pending customer negotiations exist for this Sales Rep
  }

  const handleAction = (actionType: "ACCEPT" | "COUNTER" | "REJECT") => {
    if (!selectedItem) return;

    const discountNum = counterDiscount ? parseFloat(counterDiscount) : undefined;

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
          setActionSuccess(res.message || `Successfully responded with ${actionType}`);
          setSelectedItem(null);
          setResponseMsg("");
          setCounterDiscount("");
          setTimeout(() => setActionSuccess(null), 4000);
        },
      }
    );
  };

  return (
    <div className="mb-6 bg-surface border border-border rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Customer Negotiations Inbox</h2>
          <span className="bg-warning/10 text-warning px-2 py-0.5 rounded-full text-[11px] font-bold border border-warning/20">
            {pendingItems.length} PENDING
          </span>
        </div>
      </div>

      {actionSuccess && (
        <div className="mb-4 text-[13px] text-success bg-success/10 border border-success/20 p-3 rounded flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {actionSuccess}
        </div>
      )}

      <div className="space-y-3">
        {pendingItems.map((item) => (
          <div
            key={item.id}
            className="p-3 bg-muted/30 border border-border rounded-md flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/50 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[13px] text-foreground">{item.customer_name}</span>
                <span className="text-[11px] text-foreground-muted">• Quote {item.quotation_id.slice(0, 8)}</span>
              </div>
              <p className="text-[12px] text-foreground-muted mt-0.5 line-clamp-2">
                <strong className="text-foreground">Customer Request:</strong> "{item.content}"
              </p>
              <div className="flex items-center gap-4 mt-2 text-[11px] text-foreground-muted">
                <span>Value: <strong>${item.quote_total?.toLocaleString()}</strong></span>
                <span>Margin: <strong className={item.quote_margin < 15 ? "text-danger" : "text-success"}>{item.quote_margin?.toFixed(1)}%</strong></span>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedItem(item);
                setCounterDiscount(item.counter_discount_pct ? String(item.counter_discount_pct) : "12");
              }}
              className="self-start md:self-center px-3 py-1.5 bg-primary text-primary-foreground text-[12px] font-medium rounded hover:bg-primary/90 transition-colors"
            >
              Respond
            </button>
          </div>
        ))}
      </div>

      {/* Response Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-surface border border-border rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">
                Respond to {selectedItem.customer_name}
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-foreground-muted hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-[13px]">
              <div className="bg-muted/40 p-3 rounded border border-border/50">
                <p className="text-foreground-muted">
                  <strong className="text-foreground">Customer Message:</strong> "{selectedItem.content}"
                </p>
              </div>

              <div>
                <label className="block text-foreground-muted font-medium mb-1">
                  Proposed Discount (%)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 12.0"
                  value={counterDiscount}
                  onChange={(e) => setCounterDiscount(e.target.value)}
                  className="w-full bg-muted border border-border rounded px-3 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[11px] text-foreground-muted mt-1">
                  * High discounts breaching policy limits will automatically trigger manager approval.
                </p>
              </div>

              <div>
                <label className="block text-foreground-muted font-medium mb-1">
                  Response Message to Customer
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain counter offer or confirmation details..."
                  value={responseMsg}
                  onChange={(e) => setResponseMsg(e.target.value)}
                  className="w-full bg-muted border border-border rounded px-3 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  disabled={isPending}
                  onClick={() => handleAction("REJECT")}
                  className="px-3 py-1.5 bg-danger/10 text-danger border border-danger/20 rounded font-medium hover:bg-danger/20 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  disabled={isPending}
                  onClick={() => handleAction("COUNTER")}
                  className="px-3 py-1.5 bg-warning/10 text-warning border border-warning/20 rounded font-medium hover:bg-warning/20 transition-colors disabled:opacity-50"
                >
                  Counter Offer
                </button>
                <button
                  disabled={isPending}
                  onClick={() => handleAction("ACCEPT")}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
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
