"use client";

import { useState } from "react";
import { useDeals } from "@/features/deals/hooks";
import { KanbanBoard } from "@/features/deals/components/kanban-board";
import { DealList } from "@/features/deals/components/deal-list";
import { CreateDealDialog } from "@/features/deals/components/create-deal-dialog";
import { NegotiationsInbox } from "@/features/deals/components/negotiations-inbox";
import { LayoutGrid, List, Plus, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-context";

export default function DealsPage() {
  const { user } = useAuth();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: deals, isLoading, error } = useDeals();

  const canCreate = user && ["sales_rep", "admin"].includes(user.role);

  const filteredDeals = (deals || []).filter((deal) => {
    const matchesSearch =
      !searchQuery ||
      deal.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (deal.customer?.name && deal.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (deal.customer_id && deal.customer_id.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesStatus = statusFilter === "all" || deal.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-danger text-[13px] bg-danger/5 rounded-md border border-danger/20 p-4">
        Failed to load deals. Please try again later.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Pipeline
          </h1>
          <p className="text-[13px] text-foreground-muted mt-1">
            Manage your active deals and track progress.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block w-64">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-surface border border-border rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="lead">Lead</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
          
          <div className="flex bg-surface border border-border rounded-md p-0.5">
            <button
              onClick={() => setView('kanban')}
              className={cn(
                "p-1.5 rounded-sm transition-colors",
                view === 'kanban' ? "bg-muted text-foreground shadow-sm" : "text-foreground-muted hover:text-foreground"
              )}
              title="Kanban View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                "p-1.5 rounded-sm transition-colors",
                view === 'list' ? "bg-muted text-foreground shadow-sm" : "text-foreground-muted hover:text-foreground"
              )}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          {canCreate && (
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center justify-center rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-[13px] font-medium hover:bg-primary/90 transition-colors shadow-sm ml-1"
            >
              <Plus className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">New Deal</span>
            </button>
          )}
        </div>
      </div>

      <NegotiationsInbox />

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-96 text-foreground-muted text-[13px]">
            Loading deals...
          </div>
        ) : view === 'kanban' ? (
          <KanbanBoard initialDeals={filteredDeals} />
        ) : (
          <DealList deals={filteredDeals} />
        )}
      </div>

      <CreateDealDialog isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  );
}
