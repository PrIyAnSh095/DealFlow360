"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Info, CheckCircle2, AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-context";
import { quotationsApi } from "@/features/quotations/api";
import AIExplanationModal from "@/components/AIExplanationModal";

export interface QuotationCardProps {
  id: string;
  dealId?: string;
  customerName: string;
  status: string;
  subtotal: number;
  totalDiscount: number;
  total: number;
  marginPercentage: number;
  riskScore: string;
  requiresApproval: boolean;
  productsCount?: number;
}

export function QuotationCard({
  id,
  dealId,
  customerName,
  status,
  subtotal,
  totalDiscount,
  total,
  marginPercentage,
  riskScore,
  requiresApproval,
  productsCount = 1,
}: QuotationCardProps) {
  const { user } = useAuth();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState<any>(null);

  // Role check: Only sales, manager, finance are authorized to see the Quotation AI button
  const userRole = (user?.role || "").toLowerCase();
  const canUseAi = ["sales", "manager", "finance", "admin"].includes(userRole);

  const handleOpenAiExplanation = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canUseAi) return;

    setIsAiModalOpen(true);
    setAiLoading(true);
    setAiData(null);
    try {
      const data = await quotationsApi.getAiExplanation(id);
      setAiData(data);
    } catch (err: any) {
      console.error("Failed to load AI explanation:", err);
      const errMsg = err.response?.data?.detail || err.message || "AI explanation service is currently unavailable.";
      setAiData({ error: errMsg, detail: errMsg });
    } finally {
      setAiLoading(false);
    }
  };

  const isHighRisk = riskScore === "HIGH";
  const isMedRisk = riskScore === "MEDIUM";

  return (
    <>
      <div className="relative group bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        
        {/* Top Header Row with Top-Right Corner ⓘ Button */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">
              Quotation #{id.slice(0, 8)}
            </div>
            <h3 className="text-base font-bold text-foreground mt-0.5 group-hover:text-primary transition-colors">
              {customerName}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            {/* TOP-RIGHT CORNER ⓘ AI BUTTON (Restricted to authorized roles) */}
            {canUseAi && (
              <button
                type="button"
                onClick={handleOpenAiExplanation}
                title="View AI Quotation Explanation & Decision Support"
                className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-150 shadow-xs flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <Info className="w-4 h-4" />
              </button>
            )}

            {/* Risk Badge */}
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider",
                isHighRisk
                  ? "bg-danger/10 text-danger border-danger/20"
                  : isMedRisk
                  ? "bg-warning/10 text-warning border-warning/20"
                  : "bg-success/10 text-success border-success/20"
              )}
            >
              {isHighRisk ? "High Risk" : isMedRisk ? "Med Risk" : "Low Risk"}
            </span>
          </div>
        </div>

        {/* Card Body Details */}
        <div className="grid grid-cols-2 gap-3 py-3 border-y border-border/50 text-[12px]">
          <div>
            <span className="text-foreground-muted block text-[11px]">Total Value</span>
            <span className="font-bold text-foreground text-[14px]">
              ₹{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-foreground-muted block text-[11px]">Margin</span>
            <span
              className={cn(
                "font-bold text-[14px]",
                marginPercentage < 15 ? "text-danger" : "text-success"
              )}
            >
              {marginPercentage.toFixed(1)}%
            </span>
          </div>

          <div>
            <span className="text-foreground-muted block text-[11px]">Status</span>
            <span className="font-medium text-foreground capitalize flex items-center gap-1 mt-0.5">
              {requiresApproval ? (
                <Clock className="w-3.5 h-3.5 text-warning shrink-0" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
              )}
              {status}
            </span>
          </div>

          <div>
            <span className="text-foreground-muted block text-[11px]">Products</span>
            <span className="font-medium text-foreground mt-0.5 block">
              {productsCount} Line Item(s)
            </span>
          </div>
        </div>

        {/* Action Footer */}
        <div className="mt-4 pt-2 flex items-center justify-between">
          {requiresApproval ? (
            <span className="text-[11px] font-medium text-warning flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Requires Manager Approval
            </span>
          ) : (
            <span className="text-[11px] font-medium text-success flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Customer
            </span>
          )}

          <Link
            href={`/quotations/${id}`}
            className="text-[12px] font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            <span>Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* AI Explanation Modal */}
      <AIExplanationModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        isLoading={aiLoading}
        data={aiData}
        quoteId={id.slice(0, 8)}
      />
    </>
  );
}
