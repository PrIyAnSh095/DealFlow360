"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  FileText,
  CheckCircle2,
  XCircle,
  MessageSquareDiff,
  Clock,
  User,
  Package,
  Wrench,
  RefreshCcw,
  Send,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { mockQuotations } from "@/features/customer/mock-data";
import {
  QuotationLineItem,
  NegotiationRequest,
  NegotiationRequestType,
} from "@/features/customer/types";
import { NegotiationModal } from "@/features/customer/components/negotiation-modal";
import { cn } from "@/lib/utils";

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
  negotiating:
    "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-danger/10 text-danger border-danger/20",
  expired: "bg-muted text-foreground-muted border-border",
  pending: "bg-warning/10 text-warning border-warning/20",
  accepted: "bg-success/10 text-success border-success/20",
  counter_offered: "bg-primary/10 text-primary border-primary/20",
};

const TYPE_ICON: Record<NegotiationRequestType, React.ReactNode> = {
  price: <span className="text-[11px] font-bold">₹</span>,
  quantity: <span className="text-[11px] font-bold">#</span>,
  discount: <span className="text-[11px] font-bold">%</span>,
  question: <MessageSquareDiff className="w-3 h-3" />,
  other: <span className="text-[11px] font-bold">…</span>,
};

function ProductTypeIcon({ type }: { type: QuotationLineItem["productType"] }) {
  if (type === "hardware") return <Package className="w-4 h-4 text-primary" />;
  if (type === "service") return <Wrench className="w-4 h-4 text-warning" />;
  return <RefreshCcw className="w-4 h-4 text-success" />;
}

function NegotiationBadge({
  requests,
}: {
  requests: NegotiationRequest[];
}) {
  if (requests.length === 0) return null;
  const latest = requests[requests.length - 1];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border capitalize",
        STATUS_COLORS[latest.status] ??
          "bg-muted text-foreground-muted border-border"
      )}
    >
      {TYPE_ICON[latest.type]}
      {latest.status.replace(/_/g, " ")}
    </span>
  );
}

export default function QuotationDetailPage() {
  const params = useParams();
  const quotationId = params?.id as string;

  const [quotation, setQuotation] = useState(() => {
    return mockQuotations.find((q) => q.id === quotationId) ?? mockQuotations[0];
  });

  const [activeNegotiationItem, setActiveNegotiationItem] =
    useState<QuotationLineItem | null>(null);
  const [expandedRequests, setExpandedRequests] = useState<
    Record<string, boolean>
  >({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [generalComment, setGeneralComment] = useState("");
  const [commentSent, setCommentSent] = useState(false);

  function handleNegotiationSubmit(req: {
    type: NegotiationRequestType;
    requestedPrice?: number;
    requestedQty?: number;
    requestedDiscount?: number;
    message: string;
  }) {
    if (!activeNegotiationItem) return;

    const newRequest: NegotiationRequest = {
      id: `nr-${Date.now()}`,
      lineItemId: activeNegotiationItem.id,
      type: req.type,
      requestedPrice: req.requestedPrice,
      requestedQty: req.requestedQty,
      requestedDiscount: req.requestedDiscount,
      message: req.message,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    setQuotation((prev) => ({
      ...prev,
      negotiationRequests: [...prev.negotiationRequests, newRequest],
      status: "negotiating",
    }));
  }

  function handleConfirm() {
    setQuotation((prev) => ({ ...prev, status: "approved" }));
    setConfirmed(true);
    setConfirmDialogOpen(false);
  }

  function toggleRequestExpand(id: string) {
    setExpandedRequests((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function getLineItemRequests(itemId: string) {
    return quotation.negotiationRequests.filter(
      (r) => r.lineItemId === itemId
    );
  }

  const canNegotiate =
    quotation.status === "sent" ||
    quotation.status === "negotiating" ||
    quotation.status === "under_review";
  const canConfirm =
    quotation.status === "approved" || quotation.status === "sent";

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
          You have confirmed <strong>{quotation.quotationNumber}</strong>. An
          order will be created and your sales representative will be notified.
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
      {/* Negotiation Modal */}
      {activeNegotiationItem && (
        <NegotiationModal
          lineItem={activeNegotiationItem}
          onClose={() => setActiveNegotiationItem(null)}
          onSubmit={handleNegotiationSubmit}
        />
      )}

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
                  {quotation.quotationNumber}
                </p>
              </div>
            </div>
            <p className="text-[13px] text-foreground-muted mb-2">
              By confirming, you agree to the quoted prices and terms. This will
              create an order for:
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mb-5">
              <div className="flex justify-between text-[13px] mb-1">
                <span className="text-foreground-muted">Subtotal</span>
                <span className="font-medium text-foreground">
                  {formatINR(quotation.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-[13px] mb-1">
                <span className="text-foreground-muted">Total Discount</span>
                <span className="font-medium text-success">
                  − {formatINR(quotation.totalDiscount)}
                </span>
              </div>
              <div className="flex justify-between text-[14px] font-bold border-t border-border pt-2 mt-2">
                <span className="text-foreground">Grand Total</span>
                <span className="text-foreground">
                  {formatINR(quotation.grandTotal)}
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
            {quotation.quotationNumber}
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
                  {quotation.title}
                </h1>
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-semibold border capitalize",
                    STATUS_COLORS[quotation.status] ??
                      "bg-muted text-foreground-muted border-border"
                  )}
                >
                  {quotation.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-[12px] text-foreground-muted flex-wrap">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {quotation.quotationNumber}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {quotation.salesRep}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Valid until {quotation.validUntil}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {canNegotiate && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-purple-300 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-700 text-purple-600 dark:text-purple-400 text-[12px] font-medium">
                <MessageSquareDiff className="w-3.5 h-3.5" />
                Click "Request Change" on any line item to negotiate
              </div>
            )}
            {canConfirm && (
              <button
                onClick={() => setConfirmDialogOpen(true)}
                className="flex items-center gap-2 px-5 py-2 rounded-md bg-success text-success-foreground text-[13px] font-medium hover:bg-success/90 transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Quotation
              </button>
            )}
            {quotation.status === "approved" && !canNegotiate && (
              <button
                onClick={() => setConfirmDialogOpen(true)}
                className="flex items-center gap-2 px-5 py-2 rounded-md bg-success text-success-foreground text-[13px] font-medium hover:bg-success/90 transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Quotation
              </button>
            )}
          </div>
        </div>

        {/* Notes */}
        {quotation.notes && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-[13px] text-foreground">{quotation.notes}</p>
          </div>
        )}

        {/* Line Items Table */}
        <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-[15px] font-semibold text-foreground">
              Quotation Line Items
            </h2>
            <p className="text-[12px] text-foreground-muted mt-0.5">
              Click "Request Change" on any item to start a negotiation for that
              line.
            </p>
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
                  <th className="px-6 py-3 text-center">Requests</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quotation.lineItems.map((item) => {
                  const itemRequests = getLineItemRequests(item.id);
                  const hasRequests = itemRequests.length > 0;
                  const isExpanded = expandedRequests[item.id];

                  return (
                    <>
                      <tr
                        key={item.id}
                        className="hover:bg-muted/30 transition-colors text-[13px]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                              <ProductTypeIcon type={item.productType} />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {item.productName}
                              </p>
                              <p className="text-[11px] text-foreground-muted capitalize">
                                {item.productType}
                                {item.isRecurring && (
                                  <span className="ml-1 text-success">
                                    · {item.billingCycle}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-foreground-muted">
                          {item.qty}
                        </td>
                        <td className="px-6 py-4 text-right text-foreground-muted">
                          {formatINR(item.unitPrice)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.discount > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-success/10 text-success border border-success/20">
                              {item.discount}% off
                            </span>
                          ) : (
                            <span className="text-foreground-muted text-[12px]">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-foreground text-[14px]">
                            {formatINR(item.finalPrice)}
                          </span>
                          {item.isRecurring && (
                            <span className="text-[11px] text-foreground-muted">
                              /mo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {hasRequests ? (
                            <button
                              onClick={() => toggleRequestExpand(item.id)}
                              className="flex items-center gap-1 mx-auto text-[12px] font-medium text-primary hover:underline"
                            >
                              <NegotiationBadge requests={itemRequests} />
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          ) : (
                            <span className="text-foreground-muted text-[12px]">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {canNegotiate ? (
                            <button
                              onClick={() => setActiveNegotiationItem(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-primary/30 bg-primary/5 text-primary text-[12px] font-medium hover:bg-primary/10 hover:border-primary/50 transition-all"
                            >
                              <MessageSquareDiff className="w-3.5 h-3.5" />
                              Request Change
                            </button>
                          ) : (
                            <span className="text-foreground-muted text-[12px]">
                              {quotation.status === "approved"
                                ? "Approved"
                                : "Locked"}
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded negotiation requests */}
                      {hasRequests && isExpanded && (
                        <tr key={`${item.id}-requests`}>
                          <td colSpan={7} className="px-6 pb-4 pt-0 bg-muted/20">
                            <div className="border border-border rounded-lg overflow-hidden mt-0">
                              <div className="px-4 py-2.5 bg-muted/50 border-b border-border">
                                <p className="text-[12px] font-semibold text-foreground-muted uppercase tracking-wider">
                                  Negotiation History
                                </p>
                              </div>
                              <div className="divide-y divide-border">
                                {itemRequests.map((req) => (
                                  <div
                                    key={req.id}
                                    className="px-4 py-3 flex flex-col sm:flex-row sm:items-start gap-3"
                                  >
                                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                                      {TYPE_ICON[req.type]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <p className="text-[13px] font-medium text-foreground capitalize">
                                          {req.type} request
                                        </p>
                                        <span
                                          className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border capitalize",
                                            STATUS_COLORS[req.status] ??
                                              "bg-muted text-foreground-muted border-border"
                                          )}
                                        >
                                          {req.status.replace(/_/g, " ")}
                                        </span>
                                      </div>
                                      {req.requestedPrice !== undefined && (
                                        <p className="text-[12px] text-foreground-muted">
                                          Requested price:{" "}
                                          <strong className="text-foreground">
                                            {formatINR(req.requestedPrice)}
                                          </strong>
                                        </p>
                                      )}
                                      {req.requestedQty !== undefined && (
                                        <p className="text-[12px] text-foreground-muted">
                                          Requested qty:{" "}
                                          <strong className="text-foreground">
                                            {req.requestedQty}
                                          </strong>
                                        </p>
                                      )}
                                      {req.requestedDiscount !== undefined && (
                                        <p className="text-[12px] text-foreground-muted">
                                          Requested discount:{" "}
                                          <strong className="text-foreground">
                                            {req.requestedDiscount}%
                                          </strong>
                                        </p>
                                      )}
                                      {req.counterOffer !== undefined && (
                                        <p className="text-[12px] text-primary font-medium mt-1">
                                          Counter offer:{" "}
                                          {formatINR(req.counterOffer)}
                                        </p>
                                      )}
                                      <p className="text-[12px] text-foreground-muted mt-1 italic">
                                        "{req.message}"
                                      </p>
                                      <p className="text-[11px] text-foreground-muted mt-1">
                                        Submitted{" "}
                                        {new Date(
                                          req.createdAt
                                        ).toLocaleString("en-IN")}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
                    {formatINR(quotation.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-foreground-muted">
                    Total Discount
                  </span>
                  <span className="font-medium text-success">
                    − {formatINR(quotation.totalDiscount)}
                  </span>
                </div>
                <div className="flex justify-between text-[15px] font-bold border-t border-border pt-2 mt-1">
                  <span className="text-foreground">Grand Total</span>
                  <span className="text-foreground">
                    {formatINR(quotation.grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* General Comment */}
        <div className="bg-surface border border-border rounded-lg shadow-sm p-6">
          <h2 className="text-[15px] font-semibold text-foreground mb-1">
            General Comment
          </h2>
          <p className="text-[12px] text-foreground-muted mb-4">
            Leave a note or ask a general question about this quotation.
          </p>
          {commentSent ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-success/5 border border-success/20">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <p className="text-[13px] text-success font-medium">
                Your comment has been sent to {quotation.salesRep}.
              </p>
            </div>
          ) : (
            <div className="flex gap-3">
              <textarea
                rows={3}
                placeholder="e.g. Can you confirm the warranty terms? We'd also like to discuss payment schedule..."
                value={generalComment}
                onChange={(e) => setGeneralComment(e.target.value)}
                className="flex-1 px-4 py-3 bg-background border border-border rounded-md text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-foreground-muted"
              />
              <button
                onClick={() => {
                  if (generalComment.trim()) setCommentSent(true);
                }}
                disabled={!generalComment.trim()}
                className={cn(
                  "self-end flex items-center gap-2 px-4 py-2.5 rounded-md text-[13px] font-medium transition-all",
                  generalComment.trim()
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    : "bg-muted text-foreground-muted cursor-not-allowed"
                )}
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
