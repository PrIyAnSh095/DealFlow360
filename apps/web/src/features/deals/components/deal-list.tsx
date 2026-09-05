import { Deal } from "../types";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface DealListProps {
  deals: Deal[];
}

export function DealList({ deals }: DealListProps) {
  return (
    <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden flex flex-col h-full min-h-[calc(100vh-12rem)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-[12px] font-semibold text-foreground-muted uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Deal</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium text-right">Value</th>
              <th className="px-5 py-3 font-medium text-right">Margin</th>
              <th className="px-5 py-3 font-medium text-center">Risk</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="text-[13px] divide-y divide-border">
            {deals.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-foreground-muted">
                  No deals found.
                </td>
              </tr>
            ) : (
              deals.map((deal) => {
                const isHighRisk = deal.risk === 'high';
                const isMedRisk = deal.risk === 'medium';
                
                return (
                  <tr key={deal.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">Deal {deal.id.slice(0, 6)}</td>
                    <td className="px-5 py-3 text-foreground-muted">{deal.customer?.name || 'Unknown'}</td>
                    <td className="px-5 py-3 text-right font-medium text-foreground">
                      ₹{(deal.value / 1000).toFixed(1)}k
                    </td>
                    <td className={cn(
                      "px-5 py-3 text-right font-medium",
                      isHighRisk ? "text-danger" : isMedRisk ? "text-warning" : "text-success"
                    )}>
                      N/A
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border",
                        isHighRisk ? "bg-danger/10 text-danger border-danger/20" : 
                        isMedRisk ? "bg-warning/10 text-warning border-warning/20" : 
                        "bg-success/10 text-success border-success/20"
                      )}>
                        {isHighRisk && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {isMedRisk && <Clock className="w-3 h-3 mr-1" />}
                        {!isHighRisk && !isMedRisk && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {deal.risk === 'high' ? 'High' : deal.risk === 'medium' ? 'Med' : 'Low'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-foreground-muted capitalize">
                      {deal.status}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/deals/${deal.id}`} className="text-primary font-medium hover:underline">
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
