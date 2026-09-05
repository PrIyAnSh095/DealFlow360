"use client";

import { useSubscriptions, useModifySubscription, useCancelSubscription } from "@/features/billing/hooks";
import { Subscription } from "@/features/billing/types";
import { useState } from "react";
import { RefreshCcw, Settings, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SubscriptionsPage() {
  const { data: subscriptions, isLoading } = useSubscriptions();
  const modifySub = useModifySubscription();
  const cancelSub = useCancelSubscription();
  
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [newQuantity, setNewQuantity] = useState<string>("");

  if (isLoading) {
    return <div className="p-8 text-[13px] text-foreground-muted">Loading subscriptions...</div>;
  }

  const handleModify = async () => {
    if (!selectedSub || !newQuantity) return;
    try {
      await modifySub.mutateAsync({ id: selectedSub.id, quantity: parseInt(newQuantity, 10) });
      toast.success("Subscription updated. Proration invoice generated if applicable.");
      setSelectedSub(null);
      setNewQuantity("");
    } catch (e) {
      toast.error("Failed to update subscription");
    }
  };

  const handleCancel = async () => {
    if (!selectedSub) return;
    if (confirm("Are you sure you want to cancel this subscription?")) {
      try {
        await cancelSub.mutateAsync(selectedSub.id);
        toast.success("Subscription canceled.");
        setSelectedSub(null);
      } catch (e) {
        toast.error("Failed to cancel subscription");
      }
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <RefreshCcw className="w-6 h-6 text-primary" />
            Subscriptions Engine
          </h1>
          <p className="text-sm text-foreground-muted mt-1">Manage recurring revenue, proration, and subscription lifecycles.</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm flex-1 overflow-hidden flex flex-col">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-muted text-foreground-muted border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Product / Plan</th>
              <th className="px-4 py-3 font-medium text-center">Interval</th>
              <th className="px-4 py-3 font-medium text-right">Qty</th>
              <th className="px-4 py-3 font-medium text-right">MRR</th>
              <th className="px-4 py-3 font-medium text-right">Status</th>
              <th className="px-4 py-3 font-medium w-[100px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {subscriptions?.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-foreground-muted">
                  No active subscriptions.
                </td>
              </tr>
            ) : (
              subscriptions?.map(sub => (
                <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{sub.customer_name}</td>
                  <td className="px-4 py-3 text-foreground-muted">{sub.product_name}</td>
                  <td className="px-4 py-3 text-center uppercase tracking-wider text-[11px] font-bold">{sub.interval}</td>
                  <td className="px-4 py-3 text-right">{sub.quantity}</td>
                  <td className="px-4 py-3 text-right font-medium">${(Number(sub.price_per_period) * sub.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn(
                      "inline-flex px-2 py-0.5 rounded text-[11px] font-bold uppercase",
                      sub.status === "active" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                    )}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {sub.status === "active" && (
                      <button 
                        onClick={() => { setSelectedSub(sub); setNewQuantity(sub.quantity.toString()); }}
                        className="text-primary hover:underline font-medium"
                      >
                        Manage
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-surface border border-border w-[500px] max-w-full rounded-lg shadow-xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-muted/30">
              <div>
                <h2 className="text-lg font-bold text-foreground">Manage Subscription</h2>
                <p className="text-[12px] text-foreground-muted">{selectedSub.customer_name} • {selectedSub.product_name}</p>
              </div>
              <button onClick={() => setSelectedSub(null)} className="p-1.5 text-foreground-muted hover:bg-muted rounded">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-6">
              <div className="bg-warning/10 border border-warning/20 p-3 rounded-md flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                <p className="text-[12px] text-warning">
                  <strong>Proration Engine Active:</strong> Changing quantity mid-cycle will automatically generate a prorated invoice for the remaining {selectedSub.interval}.
                </p>
              </div>
              
              <div>
                <label className="block text-[13px] font-semibold mb-1.5">New Quantity</label>
                <input 
                  type="number" 
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  className="w-full bg-background border border-input focus:border-primary outline-none rounded-md p-2 text-[13px]"
                  min="1"
                />
              </div>
            </div>
            
            <div className="px-5 py-4 border-t border-border bg-muted/30 flex justify-between">
              <button 
                onClick={handleCancel}
                disabled={cancelSub.isPending || modifySub.isPending}
                className="text-danger hover:underline text-[13px] font-medium"
              >
                Cancel Subscription
              </button>
              
              <div className="flex gap-2">
                <button onClick={() => setSelectedSub(null)} className="px-4 py-2 border border-border rounded-md text-[13px]">Close</button>
                <button 
                  onClick={handleModify}
                  disabled={modifySub.isPending || cancelSub.isPending || newQuantity === selectedSub.quantity.toString()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-[13px] font-medium disabled:opacity-50"
                >
                  Apply Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
