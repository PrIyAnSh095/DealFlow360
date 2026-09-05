import { Deal } from "../types";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface DealCardProps {
  deal: Deal;
}

export function DealCard({ deal }: DealCardProps) {
  const isHighRisk = deal.risk === 'high';
  const isMedRisk = deal.risk === 'medium';
  
  return (
    <Link href={`/deals/${deal.id}`} className="block">
      <div className="bg-surface border border-border rounded-md p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-[13px] font-semibold text-foreground leading-tight line-clamp-2">
            Deal {deal.id.slice(0, 6)}
          </h4>
        </div>
        
        <p className="text-[12px] text-foreground-muted truncate mb-3">
          {deal.customer?.name || 'Unknown Customer'}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
          <div className="text-[13px] font-bold text-foreground">
            ₹{(deal.value / 1000).toFixed(1)}k
          </div>
          
          <div className="flex items-center gap-1.5">
            <div className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center",
              isHighRisk ? "bg-danger/10 text-danger" : 
              isMedRisk ? "bg-warning/10 text-warning" : 
              "bg-success/10 text-success"
            )}>
              {isHighRisk && <AlertTriangle className="w-3 h-3 mr-1" />}
              {isMedRisk && <Clock className="w-3 h-3 mr-1" />}
              {!isHighRisk && !isMedRisk && <CheckCircle2 className="w-3 h-3 mr-1" />}
              N/A
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
