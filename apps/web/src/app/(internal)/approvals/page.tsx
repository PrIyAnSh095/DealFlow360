"use client";

import { useApprovals, useApproveRequest, useRejectRequest } from "@/features/approvals/hooks";
import { ApprovalRequestResponse } from "@/features/approvals/types";
import { useState } from "react";
import { CheckSquare, XCircle, CheckCircle2, AlertTriangle, AlertCircle, Clock } from "lucide-react";
import { ApprovalDialog } from "@/features/approvals/components/approval-dialog";

export default function ApprovalsPage() {
  const { data: approvals, isLoading } = useApprovals();
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequestResponse | null>(null);

  if (isLoading) {
    return <div className="p-8 text-[13px] text-foreground-muted">Loading approval queue...</div>;
  }

  const pendingApprovals = approvals?.filter(a => a.status === "PENDING") || [];

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col">
      
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-primary" />
            Approval Queue
          </h1>
          <p className="text-sm text-foreground-muted mt-1">Review quotations that require managerial override.</p>
        </div>
        <div className="bg-warning/10 text-warning px-3 py-1 rounded-full text-xs font-bold border border-warning/20">
          {pendingApprovals.length} PENDING
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm flex-1 overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-muted text-foreground-muted border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium w-1/4">Deal</th>
              <th className="px-4 py-3 font-medium w-1/4">Customer</th>
              <th className="px-4 py-3 font-medium text-right">Value</th>
              <th className="px-4 py-3 font-medium text-right">Margin</th>
              <th className="px-4 py-3 font-medium text-right">Status</th>
              <th className="px-4 py-3 font-medium w-[100px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pendingApprovals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-foreground-muted">
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-success/50" />
                    <span>Your queue is empty. Great job!</span>
                  </div>
                </td>
              </tr>
            ) : (
              pendingApprovals.map(req => (
                <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{req.deal_name}</td>
                  <td className="px-4 py-3 text-foreground-muted">{req.customer_name}</td>
                  <td className="px-4 py-3 text-right font-medium">${req.quote_total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center gap-1 font-bold ${req.quote_margin && req.quote_margin < 20 ? 'text-danger' : 'text-success'}`}>
                      {req.quote_margin && req.quote_margin < 20 && <AlertTriangle className="w-3 h-3" />}
                      {req.quote_margin?.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-warning/10 text-warning border border-warning/20">
                      <Clock className="w-3 h-3" /> PENDING
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => setSelectedApproval(req)}
                      className="px-3 py-1 bg-primary text-primary-foreground rounded text-[12px] font-medium hover:bg-primary/90 transition-colors"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedApproval && (
        <ApprovalDialog 
          approval={selectedApproval} 
          onClose={() => setSelectedApproval(null)} 
        />
      )}
    </div>
  );
}
