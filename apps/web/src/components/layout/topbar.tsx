"use client";

import { Search, User, LogOut, ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/features/auth/auth-context";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { searchApi, SearchResult } from "@/features/search/api";

export function Topbar() {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const results = await searchApi.globalSearch(searchQuery);
          setSearchResults(results);
        } catch (e) {
          console.error("Search failed", e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Very naive breadcrumb logic for demo purposes
  const paths = pathname.split('/').filter(Boolean);
  
  const isActive = (path: string) => pathname.startsWith(path);

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

        <div className="relative w-full max-w-sm ml-auto md:ml-4 group">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-foreground-muted" />
          <input
            type="search"
            placeholder="Search deals, quotes, customers..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => {
              if (searchQuery.length >= 2) setShowSearchResults(true);
            }}
            className="w-full pl-9 pr-4 py-1.5 bg-background border border-border rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-foreground-muted"
          />
          
          {showSearchResults && searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-lg max-h-96 overflow-y-auto z-50">
              {isSearching ? (
                <div className="p-4 text-center text-[13px] text-foreground-muted">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-[13px] text-foreground-muted">No results found for "{searchQuery}"</div>
              ) : (
                <div className="py-1">
                  {searchResults.map((result) => (
                    <Link
                      key={`${result.type}-${result.id}`}
                      href={result.url}
                      onClick={() => setShowSearchResults(false)}
                      className="flex flex-col px-4 py-2 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium text-foreground">{result.title}</span>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 rounded">{result.type}</span>
                      </div>
                      <span className="text-[12px] text-foreground-muted">{result.subtitle}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Click outside overlay for search results */}
      {showSearchResults && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={() => setShowSearchResults(false)}
        />
      )}
      
      <div className="flex items-center gap-2 ml-4">
        <ThemeToggle />
        
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
                <Link href="/deals" className={`text-[13px] px-2 py-1 rounded hover:bg-muted font-medium transition-colors ${isActive('/deals') ? 'text-primary' : 'text-foreground-muted hover:text-foreground'}`}>
                  Pipeline
                </Link>
                <Link href="/approvals" className={`text-[13px] px-2 py-1 rounded hover:bg-muted font-medium transition-colors ${isActive('/approvals') ? 'text-primary' : 'text-foreground-muted hover:text-foreground'}`}>
                  Approvals
                </Link>
                <Link href="/operations" className={`text-[13px] px-2 py-1 rounded hover:bg-muted font-medium transition-colors ${isActive('/operations') ? 'text-primary' : 'text-foreground-muted hover:text-foreground'}`}>
                  Operations
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
