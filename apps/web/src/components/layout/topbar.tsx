"use client";

import { Bell, Search, User, LogOut, ChevronRight, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/features/auth/auth-context";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { searchApi, SearchResult } from "@/features/search/api";

export function Topbar() {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const pathname = usePathname();
  const router = useRouter();
  
  const paths = pathname.split('/').filter(Boolean);
  const isActive = (path: string) => pathname.startsWith(path);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounceFn = setTimeout(() => {
      searchApi.globalSearch(searchQuery)
        .then(res => {
          setSearchResults(res);
          setShowSearchDropdown(true);
        })
        .catch(console.error)
        .finally(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearchResultClick = (url: string) => {
    setShowSearchDropdown(false);
    setSearchQuery("");
    router.push(url);
  };

  return (
    <header className="h-14 border-b border-border bg-surface px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center text-sm font-medium text-foreground-muted hidden md:flex">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">DealFlow360</Link>
          {paths.map((path, index) => (
            <div key={path} className="flex items-center">
              <ChevronRight className="w-4 h-4 mx-1 opacity-50" />
              <span className={index === paths.length - 1 ? "text-foreground capitalize" : "hover:text-foreground transition-colors capitalize"}>
                {path.replace(/-/g, ' ')}
              </span>
            </div>
          ))}
        </div>

        <div className="relative w-full max-w-sm ml-auto md:ml-4" ref={searchRef}>
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-foreground-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
            placeholder="Search deals, quotes, customers..."
            className="w-full pl-9 pr-4 py-1.5 bg-background border border-border rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-foreground-muted"
          />
          {isSearching && (
            <Loader2 className="absolute right-2.5 top-2 h-4 w-4 text-foreground-muted animate-spin" />
          )}
          
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-lg overflow-hidden z-50">
              <div className="max-h-64 overflow-y-auto py-1">
                {searchResults.map((result, idx) => (
                  <button
                    key={`${result.id}-${idx}`}
                    onClick={() => handleSearchResultClick(result.url)}
                    className="w-full text-left px-3 py-2 hover:bg-muted flex flex-col items-start transition-colors"
                  >
                    <span className="text-[13px] font-medium text-foreground">
                      {result.title}
                    </span>
                    <span className="text-[11px] text-foreground-muted">
                      {result.type} • {result.subtitle}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-4">
        <ThemeToggle />
        
        <button className="relative p-2 rounded-md hover:bg-muted text-foreground-muted hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
        </button>
        
        <div className="relative ml-2">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="h-3.5 w-3.5" />}
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-md border border-border py-1 z-50">
              <div className="px-4 py-2 border-b border-border">
                <p className="text-[13px] font-medium text-foreground truncate">{user?.name || "User"}</p>
                <p className="text-[11px] text-foreground-muted truncate capitalize">{user?.role || "Unknown Role"}</p>
              </div>
              <div className="flex flex-col gap-1 p-2 border-b border-border">
                <Link href="/settings" onClick={() => setShowDropdown(false)} className={`text-[13px] px-2 py-1 rounded hover:bg-muted font-medium transition-colors ${isActive('/settings') ? 'text-primary' : 'text-foreground-muted hover:text-foreground'}`}>
                  Settings
                </Link>
              </div>
              <button
                onClick={() => logout()}
                className="w-full text-left px-4 py-2 text-[13px] text-danger hover:bg-muted flex items-center gap-2"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
