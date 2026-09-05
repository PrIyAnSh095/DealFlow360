"use client";

import { useInvoices, usePayInvoice } from "@/features/billing/hooks";
import { Invoice } from "@/features/billing/types";
import { useState } from "react";
import { Receipt, CreditCard, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function InvoicesPage() {
  const { data: invoices, isLoading } = useInvoices();
  const payInvoice = usePayInvoice();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  if (isLoading) {
    return <div className="p-8 text-[13px] text-foreground-muted">Loading invoices...</div>;
  }

  const handlePay = async (invoiceId: string, amount: number) => {
    try {
      await payInvoice.mutateAsync({ id: invoiceId, amount, method: "credit_card" });
      toast.success("Payment processed successfully!");
      setSelectedInvoice(null);
    } catch (e) {
      toast.error("Failed to process payment");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Receipt className="w-6 h-6 text-primary" />
            Invoices & Billing
          </h1>
          <p className="text-sm text-foreground-muted mt-1">Manage hybrid billing, payments, and invoice status.</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left Column: Invoice List */}
        <div className="w-1/3 flex flex-col bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="bg-muted px-4 py-3 font-medium text-[13px] border-b border-border flex items-center justify-between">
            <span>All Invoices</span>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold">
              {invoices?.length || 0}
            </span>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-2">
            {invoices?.map(invoice => (
              <button
                key={invoice.id}
                onClick={() => setSelectedInvoice(invoice)}
                className={cn(
                  "w-full text-left p-3 rounded-md border text-[13px] transition-colors",
                  selectedInvoice?.id === invoice.id 
                    ? "bg-primary/5 border-primary text-foreground" 
                    : "bg-surface border-border text-foreground-muted hover:border-foreground-muted"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold">{invoice.customer_name || "Unknown"}</span>
                  <span className="font-bold">${Number(invoice.total).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span>INV-{invoice.id.slice(0, 6).toUpperCase()}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded font-bold uppercase",
                    invoice.payment_status === "paid" ? "bg-success/10 text-success" :
                    invoice.payment_status === "partially_paid" ? "bg-warning/10 text-warning" :
                    "bg-danger/10 text-danger"
                  )}>
                    {invoice.payment_status.replace('_', ' ')}
                  </span>
                </div>
              </button>
            ))}
            {invoices?.length === 0 && (
              <div className="p-4 text-center text-foreground-muted text-[13px]">
                No invoices found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Invoice Details */}
        <div className="w-2/3 flex flex-col bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
          {!selectedInvoice ? (
            <div className="flex-1 flex flex-col items-center justify-center text-foreground-muted">
              <Receipt className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">Select an invoice to view details</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="px-6 py-5 border-b border-border flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Invoice INV-{selectedInvoice.id.slice(0, 8).toUpperCase()}</h2>
                  <p className="text-[13px] text-foreground-muted mt-1">{selectedInvoice.customer_name}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">
                    ${Number(selectedInvoice.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[12px] text-foreground-muted mt-1">
                    Created: {new Date(selectedInvoice.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-6 space-y-6">
                <div>
                  <h3 className="text-[13px] font-semibold text-foreground mb-3 uppercase tracking-wider">Line Items</h3>
                  <table className="w-full text-left text-[13px]">
                    <thead className="text-foreground-muted border-b border-border">
                      <tr>
                        <th className="pb-2 font-medium">Description</th>
                        <th className="pb-2 font-medium text-right">Qty</th>
                        <th className="pb-2 font-medium text-right">Price</th>
                        <th className="pb-2 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {selectedInvoice.lines.map((line, i) => (
                        <tr key={i}>
                          <td className="py-3 text-foreground">{line.description || 'Item'}</td>
                          <td className="py-3 text-right text-foreground-muted">{line.quantity}</td>
                          <td className="py-3 text-right text-foreground-muted">${Number(line.unit_price).toLocaleString()}</td>
                          <td className="py-3 text-right font-medium">${Number(line.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <div className="w-64 space-y-2 text-[13px]">
                    <div className="flex justify-between text-foreground-muted">
                      <span>Subtotal</span>
                      <span>${Number(selectedInvoice.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    {Number(selectedInvoice.total_discount) > 0 && (
                      <div className="flex justify-between text-danger">
                        <span>Discount</span>
                        <span>-${Number(selectedInvoice.total_discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-foreground-muted">
                      <span>Tax</span>
                      <span>${Number(selectedInvoice.tax).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="pt-2 border-t border-border flex justify-between font-bold text-[15px] text-foreground">
                      <span>Total</span>
                      <span>${Number(selectedInvoice.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-success font-medium">
                      <span>Amount Paid</span>
                      <span>${Number(selectedInvoice.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="pt-2 border-t border-border flex justify-between font-bold text-[15px] text-foreground">
                      <span>Balance Due</span>
                      <span>${(Number(selectedInvoice.total) - Number(selectedInvoice.amount_paid)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border bg-muted/30 flex justify-end">
                {selectedInvoice.payment_status === "paid" ? (
                  <div className="flex items-center gap-2 text-success font-bold text-[13px] bg-success/10 px-4 py-2 rounded-md">
                    <CheckCircle2 className="w-4 h-4" /> Invoice Fully Paid
                  </div>
                ) : (
                  <button 
                    onClick={() => handlePay(selectedInvoice.id, Number(selectedInvoice.total) - Number(selectedInvoice.amount_paid))}
                    disabled={payInvoice.isPending}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-[13px] font-medium hover:bg-primary/90 transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    {payInvoice.isPending ? "Processing..." : "Process Payment"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
