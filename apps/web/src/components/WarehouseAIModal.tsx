"use client";

import React from "react";
import { X, Sparkles, Truck, Box, DollarSign, Clock, AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react";

interface WarehouseAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  data: any;
  orderId: string;
}

export default function WarehouseAIModal({
  isOpen,
  onClose,
  isLoading,
  data,
  orderId,
}: WarehouseAIModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface text-foreground border border-border rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Warehouse Fulfillment AI Recommendation
              </h2>
              <p className="text-xs text-foreground-muted">
                Order #{orderId} • Multi-Warehouse Stock Allocation Trade-Offs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Advisory Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-medium">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>
            AI recommendations compare backend-calculated fulfillment plans. DealFlow360 inventory & shipping rules are authoritative.
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-medium text-foreground-muted">
                Evaluating warehouse stock levels, Shiprocket courier rates & delivery ETAs...
              </p>
            </div>
          ) : !data ? (
            <div className="p-4 rounded-lg bg-danger/10 text-danger border border-danger/20 text-center">
              Unable to load warehouse AI recommendation. Please try again.
            </div>
          ) : (
            <>
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Engine: {data.ai_status === "live_ollama" ? "Ollama Local AI" : "Deterministic Fulfillment Engine"}
                </span>
                <span className="text-xs font-bold text-success uppercase tracking-wider bg-success/10 px-2.5 py-1 rounded border border-success/20">
                  Recommended: {data.recommended_plan_id || "Plan A"}
                </span>
              </div>

              {/* Summary Box */}
              <div className="p-4 rounded-lg bg-muted/40 border border-border/60">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-1">
                  Executive Fulfillment Analysis
                </h3>
                <p className="text-foreground leading-relaxed">
                  {data.summary}
                </p>
              </div>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border bg-surface space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                    <Box className="w-4 h-4" />
                    <span>Stock Utilization & Backorder Risk</span>
                  </div>
                  <p className="text-xs text-foreground-muted">
                    {data.stock_utilization_observation || "Database stock levels evaluated across all active hubs."}
                  </p>
                  <p className="text-xs text-foreground font-medium pt-1">
                    • {data.backorder_risk_observation || "No backorder risk detected."}
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-border bg-surface space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                    <DollarSign className="w-4 h-4" />
                    <span>Freight Cost & Delivery Speed</span>
                  </div>
                  <p className="text-xs text-foreground-muted">
                    {data.shipping_cost_tradeoff || "Freight rates calculated via Shiprocket / Internal rate card."}
                  </p>
                  <p className="text-xs text-foreground font-medium pt-1">
                    • {data.fulfillment_analysis}
                  </p>
                </div>
              </div>

              {/* Tradeoffs List */}
              {Array.isArray(data.tradeoffs) && data.tradeoffs.length > 0 && (
                <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Operational Trade-Offs</span>
                  </div>
                  <ul className="space-y-1 text-xs text-foreground">
                    {data.tradeoffs.map((t: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-500">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {Array.isArray(data.recommendations) && data.recommendations.length > 0 && (
                <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
                  <div className="flex items-center gap-1.5 text-primary font-semibold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Actionable Recommendations</span>
                  </div>
                  <ul className="space-y-1 text-xs text-foreground">
                    {data.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-primary">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
          <p className="text-[11px] text-foreground-muted">
            Powered by DealFlow360 Multi-Warehouse Fulfillment Engine
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            Close Recommendation
          </button>
        </div>

      </div>
    </div>
  );
}
