"use client";

import { useAuth } from "@/features/auth/auth-context";
import { Plus, Filter, Search, ArrowUpRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useEffect, useState } from "react";
import { dashboardApi } from "@/features/dashboard/api";
import { DashboardMetrics, ActivityLog } from "@/features/dashboard/types";
import { dealsApi } from "@/features/deals/api";
import { Deal } from "@/features/deals/types";
import { CreateDealDialog } from "@/features/deals/components/create-deal-dialog";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";

export default function DashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [attentionDeals, setAttentionDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const canCreate = user && ["sales_rep", "admin"].includes(user.role);

  useEffect(() => {
    let isActive = true;

    const loadDashboard = async () => {
      try {
        const [metricsData, activitiesData, dealsData] = await Promise.all([
          dashboardApi.getMetrics(),
          dashboardApi.getActivities(),
          dealsApi.getDeals()
        ]);

        if (!isActive) return;
        setMetrics(metricsData);
        setActivities(activitiesData);
        const attention = dealsData.filter(d => d.risk === 'high' || d.status === 'approval').slice(0, 5);
        setAttentionDeals(attention);
      } catch (err) {
        if (isActive) console.error("Failed to load dashboard data", err);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadDashboard();
    const refreshTimer = window.setInterval(loadDashboard, 15000);

    return () => {
      isActive = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  if (isLoading) {
    return <div className="p-8 text-[13px] text-foreground-muted flex items-center justify-center h-full">Loading dashboard...</div>;
  }

  const openDeals = metrics?.open_deals || 0;
  const atRisk = metrics?.deals_at_risk || 0;
  const healthy = Math.max(0, openDeals - atRisk);
  const healthyPct = openDeals > 0 ? (healthy / openDeals) * 100 : 0;
  const riskPct = openDeals > 0 ? (atRisk / openDeals) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Good morning, {user?.name?.split(' ')[0] || "User"}
          </h1>
          <p className="text-[13px] text-foreground-muted mt-1">
            Here&apos;s what needs your attention today.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block w-64">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-foreground-muted" />
            <input
              type="text"
              placeholder="Filter dashboard..."
              className="w-full pl-9 pr-4 py-1.5 bg-surface border border-border rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
          <button 
            onClick={() => toast.info("Filter functionality coming soon!")}
            className="flex items-center justify-center rounded-md border border-border bg-surface px-3 py-1.5 text-[13px] font-medium hover:bg-muted transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          {canCreate && (
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center justify-center rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-[13px] font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Deal
            </button>
          )}
        </div>
      </div>
      
      {/* Admin Specific Metrics */}
      {user?.role === 'admin' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-2 border-b border-border/50">
          <div className="bg-surface border border-border rounded-lg p-4 shadow-sm">
            <p className="text-[12px] font-medium text-foreground-muted uppercase tracking-wider">Total Users</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">{metrics?.total_users || 0}</span>
              <span className="text-[12px] font-medium text-primary">Registered</span>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4 shadow-sm">
            <p className="text-[12px] font-medium text-foreground-muted uppercase tracking-wider">Active Customers</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">{metrics?.active_customers || 0}</span>
              <span className="text-[12px] font-medium text-success">Engaged</span>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4 shadow-sm">
            <p className="text-[12px] font-medium text-foreground-muted uppercase tracking-wider">Products</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">{metrics?.total_products || 0}</span>
              <span className="text-[12px] font-medium text-foreground-muted">In Catalog</span>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4 shadow-sm">
            <p className="text-[12px] font-medium text-foreground-muted uppercase tracking-wider">Subscriptions</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">{metrics?.active_subscriptions || 0}</span>
              <span className="text-[12px] font-medium text-success flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-0.5" /> Active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Overview Metrics (Dense row) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/deals" className="bg-surface border border-border rounded-lg p-4 shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
          <p className="text-[12px] font-medium text-foreground-muted uppercase tracking-wider group-hover:text-foreground transition-colors">Revenue Pipeline</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">₹{((metrics?.revenue_pipeline || 0) / 1000).toFixed(1)}k</span>
            <span className="text-[12px] font-medium text-success flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> {metrics?.pipeline_growth_percent}%
            </span>
          </div>
        </Link>
        <Link href="/deals" className="bg-surface border border-border rounded-lg p-4 shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
          <p className="text-[12px] font-medium text-foreground-muted uppercase tracking-wider group-hover:text-foreground transition-colors">Deals at Risk</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-danger">{metrics?.deals_at_risk || 0}</span>
            <span className="text-[12px] font-medium text-foreground-muted">Requires review</span>
          </div>
        </Link>
        <Link href="/approvals" className="bg-surface border border-border rounded-lg p-4 shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
          <p className="text-[12px] font-medium text-foreground-muted uppercase tracking-wider group-hover:text-foreground transition-colors">Pending Approval</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-warning">{metrics?.pending_approvals || 0}</span>
            <span className="text-[12px] font-medium text-foreground-muted">Totaling ₹{((metrics?.pending_approval_value || 0) / 1000).toFixed(1)}k</span>
          </div>
        </Link>
        <Link href="/deals" className="bg-surface border border-border rounded-lg p-4 shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
          <p className="text-[12px] font-medium text-foreground-muted uppercase tracking-wider group-hover:text-foreground transition-colors">Open Deals</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{metrics?.open_deals || 0}</span>
            <span className="text-[12px] font-medium text-foreground-muted">Active negotiations</span>
          </div>
        </Link>
      </div>

      {/* 3. Main Grid (60% / 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: Deals Requiring Attention */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center">
              <h2 className="text-[15px] font-semibold text-foreground">Deals Requiring Attention</h2>
              <Link href="/deals" className="text-[13px] font-medium text-primary hover:underline">View all</Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-[12px] font-semibold text-foreground-muted uppercase tracking-wider">
                    <th className="px-5 py-3 font-medium">Deal ID</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium text-right">Value</th>
                    <th className="px-5 py-3 font-medium text-center">Risk</th>
                    <th className="px-5 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] divide-y divide-border">
                  {attentionDeals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-foreground-muted">
                        No deals currently require attention.
                      </td>
                    </tr>
                  ) : (
                    attentionDeals.map((deal) => {
                      const isHighRisk = deal.risk === 'high';
                      const isMedRisk = deal.risk === 'medium';
                      return (
                        <tr key={deal.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-foreground">Deal {deal.id.slice(0,6)}</td>
                          <td className="px-5 py-3 text-foreground-muted">{deal.customer?.name || "Unknown"}</td>
                          <td className="px-5 py-3 text-right font-medium">₹{(deal.value / 1000).toFixed(1)}k</td>
                          <td className="px-5 py-3 text-center">
                            <span className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border",
                              isHighRisk ? "bg-danger/10 text-danger border-danger/20" : 
                              isMedRisk ? "bg-warning/10 text-warning border-warning/20" : 
                              "bg-success/10 text-success border-success/20"
                            )}>
                              {deal.risk}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Link href={`/deals/${deal.id}`} className="text-primary font-medium hover:underline">Review</Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Deal Health & Activity */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <div className="bg-surface border border-border rounded-lg shadow-sm p-5">
            <h2 className="text-[15px] font-semibold text-foreground mb-4">Pipeline Health</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span className="font-medium flex items-center gap-1.5 text-foreground"><CheckCircle2 className="w-4 h-4 text-success" /> Healthy Deals</span>
                  <span className="text-foreground-muted">{healthy} deals</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-success h-2 rounded-full transition-all duration-500" style={{ width: `${healthyPct}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span className="font-medium flex items-center gap-1.5 text-foreground"><AlertTriangle className="w-4 h-4 text-danger" /> Critical Risk</span>
                  <span className="text-foreground-muted">{atRisk} deals</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-danger h-2 rounded-full transition-all duration-500" style={{ width: `${riskPct}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg shadow-sm p-5 flex-1 overflow-auto">
            <h2 className="text-[15px] font-semibold text-foreground mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <div className="text-[13px] text-foreground-muted text-center py-4">No recent activity.</div>
              ) : (
                activities.map(activity => (
                  <div key={activity.id} className="flex gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      activity.color_hint === 'primary' && "bg-primary/10 text-primary",
                      activity.color_hint === 'danger' && "bg-danger/10 text-danger",
                      activity.color_hint === 'warning' && "bg-warning/10 text-warning",
                      activity.color_hint === 'success' && "bg-success/10 text-success"
                    )}>
                      <span className="text-[11px] font-bold">{activity.initials}</span>
                    </div>
                    <div>
                      <p className="text-[13px] text-foreground">
                        <span className="font-medium">{activity.action_by}</span> {activity.action_type} <strong>{activity.target_name}</strong>
                      </p>
                      <p className="text-[11px] text-foreground-muted mt-0.5">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
      <CreateDealDialog isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  );
}
