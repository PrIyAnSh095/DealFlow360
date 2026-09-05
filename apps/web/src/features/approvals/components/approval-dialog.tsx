import { useState } from "react";
import { ApprovalRequestResponse } from "../types";
import { useApproveRequest, useRejectRequest } from "../hooks";
import { X, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface ApprovalDialogProps {
  approval: ApprovalRequestResponse;
  onClose: () => void;
}

export function ApprovalDialog({ approval, onClose }: ApprovalDialogProps) {
  const [reason, setReason] = useState("");
  const { mutate: approve, isPending: isApproving } = useApproveRequest();
  const { mutate: reject, isPending: isRejecting } = useRejectRequest();
  const [error, setError] = useState("");

  const handleAction = (actionType: 'approve' | 'reject') => {
    if (reason.trim().length < 5) {
      setError("Please provide a meaningful reason (at least 5 characters) for the audit log.");
      return;
    }
    setError("");

    const payload = { reason };
    
    if (actionType === 'approve') {
      approve({ id: approval.id, payload }, {
        onSuccess: () => onClose()
      });
    } else {
      reject({ id: approval.id, payload }, {
        onSuccess: () => onClose()
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-surface border border-border w-[600px] max-w-full rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-muted/30">
          <div>
            <h2 className="text-lg font-bold text-foreground">Review Quotation</h2>
            <p className="text-[12px] text-foreground-muted">{approval.deal_name} • {approval.customer_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-foreground-muted hover:bg-muted hover:text-foreground rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background border border-border p-3 rounded-md">
              <div className="text-[11px] text-foreground-muted font-medium uppercase tracking-wider mb-1">Net Value</div>
              <div className="text-lg font-bold text-foreground">
                ${approval.quote_total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-background border border-border p-3 rounded-md">
              <div className="text-[11px] text-foreground-muted font-medium uppercase tracking-wider mb-1">Blended Margin</div>
              <span className={`font-semibold ${Number(approval.quote_margin) < 20 ? 'text-danger' : 'text-success'}`}>
                {Number(approval.quote_margin).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="bg-danger/10 border border-danger/20 rounded-md p-4">
            <h4 className="text-[12px] font-bold text-danger flex items-center gap-1.5 mb-2">
              <AlertCircle className="w-4 h-4" /> Why was this flagged?
            </h4>
            <p className="text-[13px] text-danger/90">
              The Sales Representative submitted a quotation that violates the category discount ceilings (e.g. &gt;15% hardware discount), bringing the margin to an unacceptable level.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-foreground">Audit Reason <span className="text-danger">*</span></label>
            <p className="text-[11px] text-foreground-muted">This will be permanently logged in the Deal History.</p>
            <textarea
              className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-md p-3 text-[13px] min-h-[100px] resize-none"
              placeholder="e.g. Approved because this is a strategic land-and-expand deal."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {error && <p className="text-[12px] font-medium text-danger">{error}</p>}
          </div>

        </div>

        <div className="px-5 py-4 border-t border-border bg-muted/30 flex justify-end gap-3">
          <button 
            onClick={() => handleAction('reject')}
            disabled={isRejecting || isApproving}
            className="px-4 py-2 bg-background border border-danger/30 text-danger hover:bg-danger/5 rounded-md text-[13px] font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <XCircle className="w-4 h-4" /> Reject Quote
          </button>
          
          <button 
            onClick={() => handleAction('approve')}
            disabled={isRejecting || isApproving}
            className="px-4 py-2 bg-success text-white hover:bg-success/90 rounded-md text-[13px] font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-success/20"
          >
            <CheckCircle2 className="w-4 h-4" /> Approve Quote
          </button>
        </div>

      </div>
    </div>
  );
}
