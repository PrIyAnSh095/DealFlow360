"use client";

import { useEffect, useState } from "react";
import { healthApi, DealHealthResponse } from "@/features/health/api";
import { HeartPulse, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function HealthPage() {
  const [healthData, setHealthData] = useState<DealHealthResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    healthApi.getHealth()
      .then(setHealthData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="p-8 text-[13px] text-foreground-muted flex items-center justify-center h-full gap-2">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading deal health...
    </div>;
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-primary" />
            Deal Health
          </h1>
          <p className="text-[13px] text-foreground-muted mt-1">
            Intelligence and risk assessment for your active pipeline.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {healthData.length === 0 ? (
          <div className="col-span-full p-8 text-center text-[13px] text-foreground-muted bg-surface border border-border rounded-lg">
            No active deals to analyze.
          </div>
        ) : (
          healthData.map((health) => (
            <div key={health.id} className="bg-surface border border-border rounded-lg shadow-sm p-5 flex flex-col hover:border-primary/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-[15px]">{health.customer_name}</h3>
                  <p className="text-[12px] text-foreground-muted">Deal {health.deal_id.slice(0, 8)}</p>
                </div>
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full font-bold text-[14px]",
                  health.health_score > 80 ? "bg-success/10 text-success" :
                  health.health_score > 50 ? "bg-warning/10 text-warning" :
                  "bg-danger/10 text-danger"
                )}>
                  {health.health_score}
                </div>
              </div>
              
              <div className="space-y-3 mb-6 flex-1">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-foreground-muted">Margin Health</span>
                  <span className={health.margin_health === "Poor" ? "text-danger font-medium" : "text-foreground font-medium"}>{health.margin_health}</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-foreground-muted">Discount Risk</span>
                  <span className={health.discount_risk === "High" ? "text-danger font-medium" : "text-foreground font-medium"}>{health.discount_risk}</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-foreground-muted">Engagement</span>
                  <span className="text-foreground font-medium">{health.engagement}</span>
                </div>
              </div>

              {health.issues.length > 0 && (
                <div className="bg-danger/5 rounded-md p-3 mb-4 space-y-2">
                  <h4 className="text-[12px] font-semibold text-danger flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Identified Risks
                  </h4>
                  <ul className="list-disc pl-4 space-y-1">
                    {health.issues.map((issue, idx) => (
                      <li key={idx} className="text-[11px] text-danger/90">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-auto pt-4 border-t border-border flex justify-end">
                <Link 
                  href={`/deals/${health.deal_id}`}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
                >
                  Review Deal <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
