"use client";

import { usePublicQuote, useConfirmQuote } from "@/features/portal/hooks";
import { QuoteMessageBoard } from "@/features/portal/components/quote-message-board";
import { CheckCircle2, FileText, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

export default function PortalQuotePage() {
  const params = useParams();
  const publicId = params.public_id as string;
  const { data: quote, isLoading, error } = usePublicQuote(publicId);
  const { mutate: confirm, isPending: isConfirming } = useConfirmQuote();

  if (isLoading) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (error || !quote) {
    return <div className="p-12 text-center text-danger font-medium">Unable to load quotation. The link may be invalid.</div>;
  }

  const isAccepted = quote.status === "ACCEPTED";

  return (
    <div className="flex h-full w-full overflow-hidden">
      
      {/* Quotation Document View */}
      <div className="flex-1 overflow-y-auto bg-background/50 p-8">
        <div className="max-w-4xl mx-auto bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          
          <div className="px-8 py-6 border-b border-border flex justify-between items-start bg-muted/10">
            <div>
              <div className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider mb-1">
                Official Quotation
              </div>
              <h1 className="text-2xl font-bold text-foreground">{quote.deal_name}</h1>
              <p className="text-[13px] text-foreground-muted mt-1">Prepared for {quote.customer_name}</p>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider mb-1">
                Quote ID
              </div>
              <div className="text-[13px] font-medium font-mono text-foreground">{quote.id.split('-')[0]}</div>
              <div className="mt-2">
                {isAccepted ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-success/10 text-success text-[12px] font-bold border border-success/20">
                    <CheckCircle2 className="w-4 h-4" /> ACCEPTED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-warning/10 text-warning text-[12px] font-bold border border-warning/20">
                    PENDING
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-8">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-border/50 text-foreground-muted font-semibold">
                  <th className="pb-3">Product / Service</th>
                  <th className="pb-3 text-right">Qty</th>
                  <th className="pb-3 text-right">Unit Price</th>
                  <th className="pb-3 text-right">Discount</th>
                  <th className="pb-3 text-right text-foreground font-bold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {quote.lines.map((line) => (
                  <tr key={line.id} className="text-foreground">
                    <td className="py-4 font-medium">{line.product_name}</td>
                    <td className="py-4 text-right">{line.quantity}</td>
                    <td className="py-4 text-right">${line.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 text-right">
                      {line.discount_percent > 0 ? (
                        <span className="text-danger font-medium">{line.discount_percent}%</span>
                      ) : '-'}
                    </td>
                    <td className="py-4 text-right font-bold">${line.total_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-8 py-6 bg-muted/10 border-t border-border flex justify-end">
            <div className="w-64 space-y-3 text-[13px]">
              <div className="flex justify-between text-foreground-muted">
                <span>Subtotal</span>
                <span>${quote.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-danger font-medium">
                <span>Discounts</span>
                <span>-${quote.total_discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-bold text-base text-foreground">
                <span>Net Total</span>
                <span>${quote.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
          
          <div className="px-8 py-6 bg-background border-t border-border flex justify-between items-center">
            <p className="text-[12px] text-foreground-muted max-w-lg">
              This quotation is valid for 30 days. By accepting this quote, you agree to our standard terms of service.
            </p>
            {!isAccepted && (
              <button 
                onClick={() => confirm(publicId)}
                disabled={isConfirming}
                className="px-6 py-2.5 bg-primary text-primary-foreground font-bold text-[13px] rounded-md hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Accept Quotation
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Message Board Sidebar */}
      <QuoteMessageBoard publicId={publicId} />
      
    </div>
  );
}
