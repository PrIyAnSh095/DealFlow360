"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  FileText,
  CheckCircle2,
  Clock,
  User,
  Package,
  Wrench,
  RefreshCcw,
  Send,
  Check,
  Info,
  Download,
} from "lucide-react";
import { portalApi } from "@/features/portal/api";
import { quotationsApi } from "@/features/quotations/api";
import { PublicQuotationResponse, QuoteMessage } from "@/features/portal/types";
import { useOrgConfig, formatCurrency } from "@/features/customer/useOrgConfig";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  PENDING_APPROVAL: "bg-warning/10 text-warning border-warning/20",
  APPROVED: "bg-success/10 text-success border-success/20",
  SENT: "bg-primary/10 text-primary border-primary/20",
  NEGOTIATION: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
  ACCEPTED: "bg-success/10 text-success border-success/20",
  REJECTED: "bg-danger/10 text-danger border-danger/20",
};

export default function QuotationDetailPage() {
  const orgConfig = useOrgConfig();
  const params = useParams();
  const quotationId = params?.id as string;

  const [quotation, setQuotation] = useState<PublicQuotationResponse | null>(null);
  const [messages, setMessages] = useState<QuoteMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    Promise.all([
      portalApi.getPublicQuote(quotationId),
      portalApi.getMessages(quotationId)
    ])
      .then(([qData, mData]) => {
        setQuotation(qData);
        setMessages(mData);
      })
      .finally(() => setIsLoading(false));
  }, [quotationId]);

  async function handleConfirm() {
    try {
      await portalApi.confirmQuote(quotationId);
      setQuotation((prev) => prev ? { ...prev, status: "ACCEPTED" } : null);
      setConfirmed(true);
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error("Failed to confirm quote", error);
    }
  }

  async function handleSendMessage() {
    if (!messageInput.trim()) return;
    setIsSending(true);
    try {
      const newMsg = await portalApi.sendMessage(quotationId, {
        content: messageInput,
        sender_type: "CUSTOMER"
      });
      setMessages((prev) => [...prev, newMsg]);
      setMessageInput("");
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsSending(false);
    }
  }

  if (isLoading) {
    return <div className="p-8 text-[13px] text-foreground-muted flex items-center justify-center h-[60vh]">Loading quotation...</div>;
  }

  if (!quotation) {
    return <div className="p-8 text-[13px] text-foreground-muted flex items-center justify-center h-[60vh]">Quotation not found</div>;
  }

  const canConfirm = quotation.status === "APPROVED" || quotation.status === "SENT";

  if (confirmed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mb-5">
          <Check className="w-8 h-8 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Quotation Confirmed!
        </h1>
        <p className="text-[14px] text-foreground-muted max-w-md mb-6">
          You have confirmed <strong>{quotation.deal_name}</strong>. An
          order will be created shortly.
        </p>
        <Link
          href="/portal/orders"
          className="px-6 py-2.5 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors"
        >
          View My Orders →
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Confirm Dialog */}
      {confirmDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md p-7 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-foreground">
                  Confirm Quotation?
                </h2>
                <p className="text-[12px] text-foreground-muted">
                  {quotation.id.slice(0, 8)}
                </p>
              </div>
            </div>
            <p className="text-[13px] text-foreground-muted mb-2">
              By confirming, you agree to the quoted prices and terms. This will
              create an order for:
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mb-5">
              <div className="flex justify-between text-[13px]">
                <span className="text-foreground-muted">Subtotal</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(quotation.subtotal, orgConfig)}
                </span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-foreground-muted">Total Discount</span>
                <span className="font-medium text-success">
                  − {formatCurrency(quotation.total_discount, orgConfig)}
                </span>
              </div>
              <div className="flex justify-between text-[14px] font-bold border-t border-border pt-2 mt-2">
                <span className="text-foreground">Grand Total</span>
                <span className="text-foreground">
                  {formatCurrency(quotation.total, orgConfig)}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialogOpen(false)}
                className="flex-1 px-4 py-2 rounded-md border border-border bg-surface text-[13px] font-medium text-foreground-muted hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 rounded-md bg-success text-success-foreground text-[13px] font-medium hover:bg-success/90 transition-colors"
              >
                Yes, Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px]">
          <Link
            href="/portal/quotations"
            className="flex items-center gap-1 text-foreground-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            My Quotations
          </Link>
          <span className="text-foreground-muted">/</span>
          <span className="text-foreground font-medium">
            {quotation.id.slice(0, 8)}
          </span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">
                  {quotation.deal_name}
                </h1>
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-semibold border capitalize",
                    STATUS_COLORS[quotation.status] ??
                      "bg-muted text-foreground-muted border-border"
                  )}
                >
                  {quotation.status.replace(/_/g, " ").toLowerCase()}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-[12px] text-foreground-muted flex-wrap">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {quotation.id.slice(0, 8)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-muted px-2 py-1 rounded-md border border-border text-[12px]">
              <span className="font-semibold text-foreground-muted">Status:</span>
              <select
                value={quotation.status}
                onChange={async (e) => {
                  const newStatus = e.target.value;
                  try {
                    await quotationsApi.updateQuotationStatus(quotation.id, newStatus);
                    setQuotation((prev) => prev ? { ...prev, status: newStatus.toUpperCase() } : prev);
                  } catch (err) {
                    console.error("Failed to update status", err);
                  }
                }}
                className="bg-background border border-border text-foreground font-semibold px-2 py-0.5 rounded text-[12px] focus:ring-1 focus:ring-primary"
              >
                <option value="DRAFT">Draft</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="SENT">Sent</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
                <option value="CONFIRMED">Confirmed</option>
              </select>
            </div>
            <button
              onClick={async () => {
                try {
                  const { customerApi } = await import("@/features/customer/api");
                  const blob = await customerApi.downloadQuotationPdf(quotationId);
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Quotation_${quotationId.slice(0, 8)}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(url);
                } catch (err) {
                  console.error("Failed to download PDF", err);
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md border border-border bg-surface text-[13px] font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-primary" />
              Download PDF
            </button>
            {canConfirm && (
              <button
                onClick={() => setConfirmDialogOpen(true)}
                className="flex items-center gap-2 px-5 py-2 rounded-md bg-success text-success-foreground text-[13px] font-medium hover:bg-success/90 transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Quotation
              </button>
            )}
            {quotation.status === "ACCEPTED" && (
              <div className="px-5 py-2 rounded-md bg-success/10 text-success text-[13px] font-medium border border-success/20">
                Confirmed
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-[15px] font-semibold text-foreground">
              Quotation Line Items
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3 text-center">Qty</th>
                  <th className="px-6 py-3 text-right">Unit Price</th>
                  <th className="px-6 py-3 text-center">Discount</th>
                  <th className="px-6 py-3 text-right">Final Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quotation.lines.map((item) => {
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors text-[13px]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div>
                            <p className="font-medium text-foreground">
                              {item.product_name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-foreground-muted">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-right text-foreground-muted">
                        {formatCurrency(item.unit_price, orgConfig)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.discount_percent > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-success/10 text-success border border-success/20">
                            {item.discount_percent}% off
                          </span>
                        ) : (
                          <span className="text-foreground-muted text-[12px]">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-foreground text-[14px]">
                          {formatCurrency(item.total_price, orgConfig)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="px-6 py-5 border-t border-border bg-muted/20">
            <div className="flex justify-end">
              <div className="space-y-2 min-w-[260px]">
                <div className="flex justify-between text-[13px]">
                  <span className="text-foreground-muted">Subtotal</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(quotation.subtotal, orgConfig)}
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-foreground-muted">
                    Total Discount
                  </span>
                  <span className="font-medium text-success">
                    − {formatCurrency(quotation.total_discount, orgConfig)}
                  </span>
                </div>
                <div className="flex justify-between text-[15px] font-bold border-t border-border pt-2 mt-1">
                  <span className="text-foreground">Grand Total</span>
                  <span className="text-foreground">
                    {formatCurrency(quotation.total, orgConfig)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden flex flex-col h-[500px]">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-[15px] font-semibold text-foreground">
              Negotiation & Discussion
            </h2>
            <p className="text-[12px] text-foreground-muted">
              Talk directly with your sales representative.
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[13px] text-foreground-muted italic">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={cn("max-w-[80%] rounded-lg p-3", msg.sender_type === "CUSTOMER" ? "bg-primary/10 ml-auto border border-primary/20" : "bg-muted/50 border border-border")}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-foreground">
                      {msg.sender_type === "CUSTOMER" ? "You" : msg.sender_type === "SYSTEM" ? "System" : "Sales Rep"}
                    </span>
                    <span className="text-[10px] text-foreground-muted">
                      {new Date(msg.created_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-[13px] text-foreground whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-border bg-muted/20">
            <div className="flex gap-3">
              <textarea
                rows={2}
                placeholder="Ask about terms, request a different price, or negotiate..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-background border border-border rounded-md text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-foreground-muted"
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || isSending}
                className={cn(
                  "self-end flex items-center gap-2 px-4 py-2.5 rounded-md text-[13px] font-medium transition-all",
                  messageInput.trim() && !isSending
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    : "bg-muted text-foreground-muted cursor-not-allowed"
                )}
              >
                <Send className="w-3.5 h-3.5" />
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
