"use client";

import { usePendingOrders, useFulfillmentRecommendation, useSubmitFulfillment } from "@/features/operations/hooks";
import { Order } from "@/features/operations/types";
import { useState } from "react";
import { Package, Truck, Receipt, CheckCircle2, AlertCircle } from "lucide-react";

export default function OperationsPage() {
  const { data: orders, isLoading: isLoadingOrders } = usePendingOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: recommendation, isLoading: isLoadingRec } = useFulfillmentRecommendation(selectedOrder?.id || null);
  const submitFulfillment = useSubmitFulfillment();

  if (isLoadingOrders) {
    return <div className="p-8 text-[13px] text-foreground-muted">Loading operations queue...</div>;
  }

  const handleFulfill = async () => {
    if (!selectedOrder || !recommendation) return;
    
    // Flatten all allocations for the API
    const allocations = recommendation.lines.flatMap(line => line.recommended_allocations);
    
    try {
      await submitFulfillment.mutateAsync({ orderId: selectedOrder.id, allocations });
      alert("Order fulfilled successfully!");
    } catch (e) {
      alert("Failed to fulfill order.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Operations & Fulfillment
          </h1>
          <p className="text-sm text-foreground-muted mt-1">Manage pending orders and generate fulfillment plans.</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left Column: Order Queue */}
        <div className="w-1/3 flex flex-col bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="bg-muted px-4 py-3 font-medium text-[13px] text-foreground-muted border-b border-border flex items-center justify-between">
            <span>Pending Orders</span>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold">
              {orders?.length || 0}
            </span>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-2">
            {orders?.map(order => (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`w-full text-left p-3 rounded-md border text-[13px] transition-colors ${
                  selectedOrder?.id === order.id 
                    ? "bg-primary/5 border-primary text-foreground" 
                    : "bg-surface border-border text-foreground-muted hover:border-foreground-muted"
                }`}
              >
                <div className="font-semibold">{order.customer_name}</div>
                <div className="text-[11px] opacity-70 mt-1 flex justify-between">
                  <span>Order: {order.id.slice(0, 8)}</span>
                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
            {orders?.length === 0 && (
              <div className="p-4 text-center text-foreground-muted text-[13px]">
                No pending orders.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Fulfillment Planner */}
        <div className="w-2/3 flex flex-col gap-6 overflow-y-auto">
          {!selectedOrder ? (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border rounded-lg text-foreground-muted">
              <Truck className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">Select an order to view fulfillment plan</p>
            </div>
          ) : (
            <>
              {/* Fulfillment Panel */}
              <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="bg-muted px-4 py-3 font-medium text-[13px] border-b border-border flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-foreground-muted" />
                    Intelligent Fulfillment Plan
                  </span>
                </div>
                
                <div className="p-4">
                  {isLoadingRec ? (
                    <div className="text-[13px] text-foreground-muted">Generating fulfillment recommendation...</div>
                  ) : recommendation ? (
                    <div className="space-y-4">
                      {recommendation.lines.map((line, i) => (
                        <div key={i} className="border border-border rounded-md p-3">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-semibold text-[13px]">{line.product_name}</span>
                            <span className="text-[12px] bg-muted px-2 py-1 rounded text-foreground-muted">
                              Req: {line.requested_quantity}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            {line.recommended_allocations.map((alloc, j) => (
                              <div key={j} className={`flex justify-between items-center text-[12px] p-2 rounded ${alloc.warehouse_id ? 'bg-primary/5 border border-primary/20 text-primary' : 'bg-destructive/10 border border-destructive/20 text-destructive'}`}>
                                <span className="flex items-center gap-2">
                                  {alloc.warehouse_id ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                  {alloc.warehouse_id ? `Allocate from ${alloc.warehouse_id === 'w-1' ? 'East Coast Hub' : 'West Coast Hub'}` : 'BACKORDER (No Stock)'}
                                </span>
                                <span className="font-bold">{alloc.quantity} units</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      <div className="pt-4 flex justify-end">
                        <button 
                          onClick={handleFulfill}
                          disabled={submitFulfillment.isPending}
                          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-[13px] font-medium hover:bg-primary/90 transition-colors"
                        >
                          {submitFulfillment.isPending ? "Processing..." : "Confirm & Deduct Stock"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Real Billing / Invoice Actions */}
              <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="bg-muted px-4 py-3 font-medium text-[13px] border-b border-border flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-foreground-muted" />
                    Billing & Invoicing
                  </span>
                </div>
                <div className="p-4 text-[13px] text-foreground-muted">
                  <div className="mt-2 p-3 bg-muted rounded flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-[12px]">Invoice generation is available after order fulfillment. Click below to generate the final invoice and start subscriptions.</p>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <button 
                      onClick={async () => {
                         try {
                           const res = await fetch(`http://localhost:8000/api/v1/billing/orders/${selectedOrder.id}/generate-invoice`, {
                             method: 'POST',
                             headers: { 'Authorization': `Bearer ${localStorage.getItem('dealflow_token')}` }
                           });
                           if (res.ok) {
                              alert('Invoice generated successfully!');
                           } else {
                              alert('Failed to generate invoice.');
                           }
                         } catch (e) {
                           alert('Error generating invoice.');
                         }
                      }}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-[13px] font-medium hover:bg-primary/90 transition-colors"
                    >
                      Generate Real Invoice
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
