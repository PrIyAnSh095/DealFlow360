"use client";

import React from "react";
import { X, Sparkles, AlertTriangle, CheckCircle, ShieldAlert, Truck, Info, RefreshCw } from "lucide-react";

interface AIExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  data: any;
  quoteId: string;
}

export default function AIExplanationModal({
  isOpen,
  onClose,
  isLoading,
  data,
  quoteId
}: AIExplanationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface text-foreground border border-border rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                AI Quotation Explanation
              </h2>
              <p className="text-xs text-foreground-muted">
                Quotation #{quoteId} • Decision Support & Fact Analysis
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
          <Info className="w-4 h-4 shrink-0" />
          <span>
            AI insights are advisory. DealFlow360 business rules and backend calculations are authoritative.
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-medium text-foreground-muted">
                Analyzing PostgreSQL customer history & quotation facts with Ollama...
              </p>
            </div>
          ) : !data ? (
            <div className="p-4 rounded-lg bg-danger/10 text-danger border border-danger/20 text-center font-medium">
              Unable to load AI quotation explanation. Please try again.
            </div>
          ) : (data.error || data.detail) ? (
            <div className="p-6 rounded-xl bg-danger/10 text-danger border border-danger/20 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 font-bold text-base">
                <AlertTriangle className="w-6 h-6 text-danger" />
                <span>AI Service Error</span>
              </div>
              <p className="text-sm font-medium text-foreground">{data.detail || data.error}</p>
            </div>
          ) : (
            <>
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Provider: Ollama Local AI (qwen3:4b)
                </span>
              </div>

              {/* Summary Box */}
              <div className="p-4 rounded-lg bg-muted/40 border border-border/60">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-1">
                  Executive Summary
                </h3>
                <p className="text-foreground leading-relaxed">
                  {data.summary}
                </p>
              </div>

              {/* Grid Context: Customer & Quotation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border bg-surface space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Customer Overview
                  </h4>
                  <p className="text-foreground-muted text-xs leading-normal">
                    {data.customer_context || "Customer history analysis based on PostgreSQL records."}
                  </p>
                  {data.loyalty_observation && (
                    <p className="text-xs text-foreground font-medium pt-1">
                      • {data.loyalty_observation}
                    </p>
                  )}
                  {data.purchase_behavior && (
                    <p className="text-xs text-foreground font-medium">
                      • {data.purchase_behavior}
                    </p>
                  )}
                  {data.subscription_observation && (
                    <p className="text-xs text-foreground font-medium">
                      • {data.subscription_observation}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-lg border border-border bg-surface space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Financial & Pricing Analysis
                  </h4>
                  <p className="text-foreground-muted text-xs leading-normal">
                    {data.quotation_analysis || "Authoritative quotation metrics recalculated by FastAPI."}
                  </p>
                  {data.margin_observation && (
                    <p className="text-xs text-foreground font-medium pt-1">
                      • {data.margin_observation}
                    </p>
                  )}
                  {data.discount_observation && (
                    <p className="text-xs text-foreground font-medium">
                      • {data.discount_observation}
                    </p>
                  )}
                  {data.approval_observation && (
                    <p className="text-xs text-foreground font-medium">
                      • {data.approval_observation}
                    </p>
                  )}
                </div>
              </div>

              {/* Fulfillment & Shipping */}
              {(data.fulfillment_observation || data.shipping_observation) && (
                <div className="p-4 rounded-lg border border-border bg-surface space-y-2">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                    <Truck className="w-4 h-4" />
                    <span>Fulfillment & Logistics Observations</span>
                  </div>
                  {data.fulfillment_observation && (
                    <p className="text-xs text-foreground">
                      • {data.fulfillment_observation}
                    </p>
                  )}
                  {data.shipping_observation && (
                    <p className="text-xs text-foreground-muted">
                      • {data.shipping_observation}
                    </p>
                  )}
                </div>
              )}

              {/* Risks & Opportunities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Risks */}
                <div className="p-4 rounded-lg border border-danger/30 bg-danger/5 space-y-2">
                  <div className="flex items-center gap-1.5 text-danger font-semibold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Identified Commercial Risks</span>
                  </div>
                  <ul className="space-y-1 text-xs text-foreground">
                    {Array.isArray(data.risks) && data.risks.length > 0 ? (
                      data.risks.map((r: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-danger">•</span>
                          <span>{r}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-foreground-muted">No high risks detected.</li>
                    )}
                  </ul>
                </div>

                {/* Opportunities */}
                <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                    <CheckCircle className="w-4 h-4" />
                    <span>Deal Opportunities</span>
                  </div>
                  <ul className="space-y-1 text-xs text-foreground">
                    {Array.isArray(data.opportunities) && data.opportunities.length > 0 ? (
                      data.opportunities.map((o: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-500">•</span>
                          <span>{o}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-foreground-muted">Standard execution opportunity.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Recommendations */}
              {Array.isArray(data.recommendations) && data.recommendations.length > 0 && (
                <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Actionable Recommendations
                  </h4>
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
            Powered by DealFlow360 Local Ollama Intelligence Engine
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            Close Explanation
          </button>
        </div>

      </div>
    </div>
  );
}
