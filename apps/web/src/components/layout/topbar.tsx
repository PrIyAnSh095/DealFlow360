import { Bell, Search, User } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Topbar() {
  return (
    <header className="h-16 border-b border-border bg-background px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center flex-1">
        <div className="relative w-64 md:w-96 hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search deals, quotes, customers..."
            className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-transparent rounded-md text-sm focus:outline-none focus:border-border focus:bg-background transition-colors"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <ThemeToggle />
        
        <button className="relative p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full ring-2 ring-background" />
        </button>
        
        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 cursor-pointer">
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  );
}
