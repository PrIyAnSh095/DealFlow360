"use client";

import { useState } from "react";
import { useDeals } from "@/features/deals/hooks";
import { KanbanBoard } from "@/features/deals/components/kanban-board";
import { DealList } from "@/features/deals/components/deal-list";
import { LayoutGrid, List, Plus, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DealsPage() {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const { data: deals, isLoading, error } = useDeals();

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
              className="w-full pl-9 pr-4 py-1.5 bg-surface border border-border rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
          
          <button className="flex items-center justify-center rounded-md border border-border bg-surface px-3 py-1.5 text-[13px] font-medium hover:bg-muted transition-colors">
            <Filter className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Filters</span>
          </button>
          
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
          
          <button className="flex items-center justify-center rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-[13px] font-medium hover:bg-primary/90 transition-colors shadow-sm ml-1">
            <Plus className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">New Deal</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-96 text-foreground-muted text-[13px]">
            Loading deals...
          </div>
        ) : view === 'kanban' ? (
          <KanbanBoard initialDeals={deals || []} />
        ) : (
          <DealList deals={deals || []} />
        )}
      </div>
    </div>
  );
}
