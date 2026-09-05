"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  ShoppingBag,
  Truck,
  Receipt,
  RefreshCcw,
  LogOut,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/features/auth/auth-context";

const customerNav = [
  {
    section: "Overview",
    items: [
      { name: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    section: "Quotations",
    items: [
      { name: "My Quotations", href: "/portal/quotations", icon: FileText },
    ],
  },
  {
    section: "Orders & Billing",
    items: [
      { name: "My Orders", href: "/portal/orders", icon: ShoppingBag },
      { name: "Invoices", href: "/portal/invoices", icon: Receipt },
      { name: "Subscriptions", href: "/portal/subscriptions", icon: RefreshCcw },
    ],
  },
];

export function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      localStorage.removeItem("dealflow_token");
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = user.name || "Customer User";
  const displayRole = user.role ? user.role.toUpperCase() : "CUSTOMER";
  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2) || "CU";

  return (
    <div className="flex h-screen overflow-hidden bg-background text-[13px]">
      {/* Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-full bg-surface border-r border-border transition-all duration-300 relative z-20",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b border-border">
          <Link href="/portal/dashboard" className="flex items-center gap-2 overflow-hidden">
            <div className="shrink-0 w-8 h-8 bg-primary rounded-md flex items-center justify-center font-bold text-primary-foreground text-sm">
              D
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="font-semibold text-[14px] tracking-tight whitespace-nowrap text-foreground">
                  DealFlow360
                </p>
                <p className="text-[10px] text-foreground-muted whitespace-nowrap">
                  Customer Portal
                </p>
              </div>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
          {customerNav.map((section) => (
            <div key={section.section}>
              {!collapsed && (
                <h3 className="px-2 mb-2 text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">
                  {section.section}
                </h3>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/portal/dashboard" &&
                      pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.name : undefined}
                        className={cn(
                          "flex items-center gap-3 px-2 py-1.5 rounded-md text-[13px] transition-colors group relative",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground-muted hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0",
                            isActive
                              ? "text-primary"
                              : "text-foreground-muted group-hover:text-foreground"
                          )}
                        />
                        {!collapsed && (
                          <span className="flex-1 truncate">{item.name}</span>
                        )}
                        {"badge" in item && (item as { badge?: string }).badge && !collapsed && (
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                            {(item as { badge?: string }).badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-border p-3">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                <span className="text-[11px] font-bold text-primary">{userInitials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-foreground truncate">
                  {displayName}
                </p>
                <p className="text-[10px] text-foreground-muted capitalize">{displayRole}</p>
              </div>
              <ThemeToggle className="p-1 h-7 w-7 text-foreground-muted hover:text-foreground" />
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-foreground-muted hover:text-danger transition-colors p-1 disabled:opacity-50"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
                <span className="text-[11px] font-bold text-primary">{userInitials}</span>
              </div>
              <ThemeToggle className="p-1 h-7 w-7 text-foreground-muted hover:text-foreground" />
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-foreground-muted hover:text-danger transition-colors p-1 disabled:opacity-50"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-foreground-muted hover:text-foreground shadow-sm z-20"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-border bg-surface px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-foreground-muted" />
              <input
                type="search"
                placeholder="Search quotations, orders..."
                className="w-full pl-9 pr-4 py-1.5 bg-background border border-border rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-foreground-muted"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="h-8 w-8 flex items-center justify-center" />
            <button className="relative p-2 rounded-md hover:bg-muted text-foreground-muted hover:text-foreground transition-colors" title="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-danger rounded-full ring-2 ring-surface" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center border border-primary/20 hover:bg-primary/20 transition-colors text-[11px] font-bold"
              >
                {userInitials}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-surface rounded-md shadow-lg border border-border py-1 z-50">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-[13px] font-medium text-foreground">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-foreground-muted capitalize">{displayRole}</p>
                  </div>
                  <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                    <span className="text-[12px] text-foreground-muted">Theme</span>
                    <ThemeToggle />
                  </div>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full text-left px-4 py-2 text-[13px] text-danger hover:bg-muted flex items-center gap-2 disabled:opacity-50"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
