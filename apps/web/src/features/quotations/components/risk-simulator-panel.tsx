import { QuoteRecalculateResponse } from "../types";
import { AlertCircle, CheckCircle2, AlertTriangle, Activity } from "lucide-react";

interface RiskSimulatorPanelProps {
  simulation: QuoteRecalculateResponse | null;
  isLoading: boolean;
}

export function RiskSimulatorPanel({ simulation, isLoading }: RiskSimulatorPanelProps) {
  if (!simulation) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5 flex flex-col items-center justify-center text-center space-y-3 min-h-[300px]">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground-muted">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-[13px] font-medium text-foreground">Risk Simulator</h3>
          <p className="text-[12px] text-foreground-muted mt-1 max-w-[200px]">
            Add products and adjust discounts to see live margin and risk calculations.
          </p>
        </div>
      </div>
    );
  }

  const { risk_score, requires_approval, margin_percentage, subtotal, total_discount, total, explanations } = simulation;

  const isHighRisk = risk_score === "HIGH";
  const isMediumRisk = risk_score === "MEDIUM";
  
  return (
    <div className={`rounded-lg border transition-all duration-300 ${isHighRisk ? 'border-danger/30 bg-danger/5 shadow-[0_0_15px_rgba(239,68,68,0.05)]' : isMediumRisk ? 'border-warning/30 bg-warning/5' : 'border-border bg-surface'} p-5 flex flex-col space-y-6 relative overflow-hidden`}>
      
      {/* Loading overlay for debounced updates */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Header & Score */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground">Deal Simulation</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[12px] text-foreground-muted">Live Margin:</span>
            <span className={`text-[13px] font-bold ${margin_percentage < 20 ? 'text-warning' : 'text-success'}`}>
              {margin_percentage.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 
          ${isHighRisk ? 'bg-danger text-white' : isMediumRisk ? 'bg-warning text-white' : 'bg-success/10 text-success'}
        `}>
          {isHighRisk ? <AlertCircle className="w-3.5 h-3.5" /> : isMediumRisk ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          {risk_score} RISK
        </div>
      </div>

      {/* Financial Breakdown */}
      <div className="space-y-2.5 bg-background/50 p-4 rounded-md border border-border">
        <div className="flex justify-between text-[13px]">
          <span className="text-foreground-muted">Subtotal</span>
          <span className="font-medium">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-[13px]">
          <span className="text-foreground-muted">Total Discount</span>
          <span className="font-medium text-danger">-${total_discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="h-px bg-border my-1"></div>
        <div className="flex justify-between text-[15px] font-semibold">
          <span className="text-foreground">Net Total</span>
          <span className="text-foreground">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Governance Explanations */}
      {requires_approval && (
        <div className="bg-danger/10 border border-danger/20 rounded-md p-3.5">
          <h4 className="text-[12px] font-bold text-danger uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <AlertCircle className="w-3.5 h-3.5" /> Manager Approval Required
          </h4>
          <ul className="space-y-1.5">
            {explanations.map((exp, i) => (
              <li key={i} className="text-[12px] text-danger/90 flex items-start gap-1.5">
                <span className="mt-1 w-1 h-1 rounded-full bg-danger/50 shrink-0"></span>
                <span>{exp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {!requires_approval && (
        <div className="bg-success/10 border border-success/20 rounded-md p-3.5 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span className="text-[12px] font-medium text-success">This deal is currently auto-approved by policy.</span>
        </div>
      )}
    </div>
  );
}
