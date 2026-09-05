"use client";

import { useAuth } from "@/features/auth/auth-context";
import { Plus, Filter, Search, ArrowUpRight, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Good morning, {user?.name?.split(' ')[0] || "Kaushik"}
          </h1>
          <p className="text-[13px] text-foreground-muted mt-1">
            Here's what needs your attention today.
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
          <button className="flex items-center justify-center rounded-md border border-border bg-surface px-3 py-1.5 text-[13px] font-medium hover:bg-muted transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          <button className="flex items-center justify-center rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-[13px] font-medium hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            New Deal
          </button>
        </div>
      </div>

      {/* 2. Overview Metrics (Dense row) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-lg p-4 shadow-sm">
          <p className="text-[12px] font-medium text-foreground-muted uppercase tracking-wider">Revenue Pipeline</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">₹2.4M</span>
            <span className="text-[12px] font-medium text-success flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> 12%
            </span>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 shadow-sm">
          <p className="text-[12px] font-medium text-foreground-muted uppercase tracking-wider">Deals at Risk</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-danger">3</span>
            <span className="text-[12px] font-medium text-foreground-muted">Requires review</span>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 shadow-sm">
          <p className="text-[12px] font-medium text-foreground-muted uppercase tracking-wider">Pending Approval</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-warning">5</span>
            <span className="text-[12px] font-medium text-foreground-muted">Totaling ₹420k</span>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 shadow-sm">
          <p className="text-[12px] font-medium text-foreground-muted uppercase tracking-wider">Open Deals</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">24</span>
            <span className="text-[12px] font-medium text-foreground-muted">Active negotiations</span>
          </div>
        </div>
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
                    <th className="px-5 py-3 font-medium">Deal</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium text-right">Margin</th>
                    <th className="px-5 py-3 font-medium text-center">Risk</th>
                    <th className="px-5 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] divide-y divide-border">
                  <tr className="hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">Acme Renewal</td>
                    <td className="px-5 py-3 text-foreground-muted">Acme Corp</td>
                    <td className="px-5 py-3 text-right font-medium text-danger">18.2%</td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-danger/10 text-danger border border-danger/20">High</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button className="text-primary font-medium hover:underline">Review</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">Globex Server Expansion</td>
                    <td className="px-5 py-3 text-foreground-muted">Globex Ltd</td>
                    <td className="px-5 py-3 text-right font-medium text-warning">24.1%</td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-warning/10 text-warning border border-warning/20">Med</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button className="text-primary font-medium hover:underline">Review</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">Initech Fleet Upgrade</td>
                    <td className="px-5 py-3 text-foreground-muted">Initech</td>
                    <td className="px-5 py-3 text-right font-medium text-success">32.0%</td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-success/10 text-success border border-success/20">Low</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button className="text-foreground-muted font-medium hover:text-foreground hover:underline">Approve</button>
                    </td>
                  </tr>
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
                  <span className="text-foreground-muted">18 deals</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-success h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span className="font-medium flex items-center gap-1.5 text-foreground"><Clock className="w-4 h-4 text-warning" /> Warning / Stalled</span>
                  <span className="text-foreground-muted">4 deals</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-warning h-2 rounded-full" style={{ width: '20%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span className="font-medium flex items-center gap-1.5 text-foreground"><AlertTriangle className="w-4 h-4 text-danger" /> Critical Risk</span>
                  <span className="text-foreground-muted">2 deals</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-danger h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg shadow-sm p-5 flex-1">
            <h2 className="text-[15px] font-semibold text-foreground mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-primary">AJ</span>
                </div>
                <div>
                  <p className="text-[13px] text-foreground"><span className="font-medium">Alice Jones</span> approved <strong>Acme Renewal</strong></p>
                  <p className="text-[11px] text-foreground-muted mt-0.5">2 hours ago</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-danger" />
                </div>
                <div>
                  <p className="text-[13px] text-foreground">Margin alert triggered on <strong>Globex Server Expansion</strong></p>
                  <p className="text-[11px] text-foreground-muted mt-0.5">4 hours ago</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-warning">SM</span>
                </div>
                <div>
                  <p className="text-[13px] text-foreground"><span className="font-medium">Sarah Miller</span> requested changes on <strong>Initech Fleet Upgrade</strong></p>
                  <p className="text-[11px] text-foreground-muted mt-0.5">Yesterday</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
