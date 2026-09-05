"use client";

import { useAnalytics } from "@/features/analytics/hooks";
import { BarChart as BarChartIcon, TrendingUp, TrendingDown, DollarSign, Clock, Target, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const { data, isLoading } = useAnalytics();

  if (isLoading || !data) {
    return <div className="p-8 text-[13px] text-foreground-muted">Loading analytics data...</div>;
  }

  const { overview, revenue_trend, discount_trend } = data;
  
  // Find max values for CSS chart scaling
  const maxRevenue = Math.max(...revenue_trend.map(d => d.value));
  const maxDiscount = Math.max(...discount_trend.map(d => d.value));

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col overflow-y-auto">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChartIcon className="w-6 h-6 text-primary" />
            Executive Analytics
          </h1>
          <p className="text-sm text-foreground-muted mt-1">High-level performance metrics, win rates, and trends.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
          <div className="text-[12px] font-bold text-foreground-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-success" /> Total Revenue
          </div>
          <div className="text-3xl font-bold text-foreground">
            ${(overview.total_revenue / 1000).toFixed(1)}k
          </div>
          <div className="text-[11px] text-success font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12.5% vs last month
          </div>
        </div>
        
        <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
          <div className="text-[12px] font-bold text-foreground-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-primary" /> Win Rate
          </div>
          <div className="text-3xl font-bold text-foreground">
            {overview.win_rate.toFixed(1)}%
          </div>
          <div className="text-[11px] text-success font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +2.1% vs last month
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
          <div className="text-[12px] font-bold text-foreground-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-warning" /> Cycle Time
          </div>
          <div className="text-3xl font-bold text-foreground">
            {overview.avg_cycle_time_days.toFixed(1)} <span className="text-lg font-medium text-foreground-muted">days</span>
          </div>
          <div className="text-[11px] text-success font-medium mt-1 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> -4.2 days vs last month
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
          <div className="text-[12px] font-bold text-foreground-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-danger" /> Avg Discount
          </div>
          <div className="text-3xl font-bold text-foreground">
            {overview.avg_discount.toFixed(1)}%
          </div>
          <div className="text-[11px] text-danger font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +0.5% vs last month
          </div>
        </div>
        
        <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
          <div className="text-[12px] font-bold text-foreground-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-primary" /> Active Deals
          </div>
          <div className="text-3xl font-bold text-foreground">
            {overview.active_deals}
          </div>
          <div className="text-[11px] text-foreground-muted font-medium mt-1">
            Current pipeline size
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-lg shadow-sm p-6">
          <h3 className="text-[14px] font-bold text-foreground mb-6">Revenue Trend (YTD)</h3>
          <div className="h-64 flex items-end gap-2 justify-between">
            {revenue_trend.map((point, idx) => {
              const heightPercent = maxRevenue > 0 ? (point.value / maxRevenue) * 100 : 0;
              return (
                <div key={idx} className="flex flex-col items-center flex-1 gap-2 group relative">
                  <div 
                    className="w-full bg-primary/20 group-hover:bg-primary/30 border border-primary/30 rounded-t-sm transition-all duration-300 relative"
                    style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-md">
                      ${(point.value / 1000).toFixed(1)}k
                    </div>
                  </div>
                  <div className="text-[11px] font-medium text-foreground-muted">{point.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg shadow-sm p-6">
          <h3 className="text-[14px] font-bold text-foreground mb-6">Discounting Trend (YTD)</h3>
          <div className="h-64 flex items-end gap-2 justify-between">
            {discount_trend.map((point, idx) => {
              const heightPercent = maxDiscount > 0 ? (point.value / maxDiscount) * 100 : 0;
              // Color based on risk threshold (>15% is high risk)
              const isHigh = point.value > 15;
              const isMedium = point.value > 10 && point.value <= 15;
              
              const barColor = isHigh 
                ? 'bg-danger/20 border-danger/30 group-hover:bg-danger/30' 
                : isMedium 
                  ? 'bg-warning/20 border-warning/30 group-hover:bg-warning/30'
                  : 'bg-success/20 border-success/30 group-hover:bg-success/30';
                  
              return (
                <div key={idx} className="flex flex-col items-center flex-1 gap-2 group relative">
                  <div 
                    className={cn("w-full border rounded-t-sm transition-all duration-300 relative", barColor)}
                    style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-md">
                      {point.value.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-[11px] font-medium text-foreground-muted">{point.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
