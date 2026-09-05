"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/config/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-context";

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();

  return (
    <aside 
      className={cn(
        "relative flex flex-col h-full bg-surface border-r border-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex items-center h-14 px-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
          <div className="shrink-0 w-8 h-8 bg-primary rounded flex items-center justify-center font-bold text-primary-foreground text-sm">
            D
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-[15px] tracking-tight whitespace-nowrap">
              DealFlow360
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {navigation.map((section) => {
          const visibleItems = section.items.filter(item => 
            !("roles" in item) || (user && (item as any).roles.includes(user.role))
          );
          
          if (visibleItems.length === 0) return null;

          return (
          <div key={section.name}>
            {!isCollapsed && (
              <h3 className="px-2 mb-2 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">
                {section.name}
              </h3>
            )}
            <ul className="space-y-0.5">
              {visibleItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      title={isCollapsed ? item.name : undefined}
                      className={cn(
                        "flex items-center gap-3 px-2 py-1.5 rounded-md text-[13px] transition-colors group",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground-muted hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-foreground-muted group-hover:text-foreground")} />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          );
        })}
      </nav>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-foreground-muted hover:text-foreground shadow-sm z-20"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
}
