"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "p-2 rounded-md hover:bg-muted text-foreground-muted hover:text-foreground transition-all duration-200 relative",
        className
      )}
      title={isDark ? "Switch to White Mode" : "Switch to Dark Mode"}
      aria-label={isDark ? "Switch to White Mode" : "Switch to Dark Mode"}
    >
      {mounted ? (
        isDark ? (
          <Moon className="h-4 w-4 text-primary transition-transform duration-200 rotate-0" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500 transition-transform duration-200 rotate-0" />
        )
      ) : (
        <Sun className="h-4 w-4 opacity-50" />
      )}
    </button>
  );
}

export function ThemeSegmentedToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  return (
    <div
      className={cn(
        "inline-flex items-center p-1 rounded-lg bg-muted/70 border border-border text-[12px] font-medium transition-colors",
        className
      )}
      role="group"
      aria-label="Theme selector"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200",
          !isDark && mounted
            ? "bg-surface text-foreground font-semibold shadow-sm border border-border/60"
            : "text-foreground-muted hover:text-foreground"
        )}
      >
        <Sun className={cn("w-3.5 h-3.5", !isDark && mounted ? "text-amber-500" : "text-foreground-muted")} />
        <span>White Mode</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200",
          isDark && mounted
            ? "bg-surface text-foreground font-semibold shadow-sm border border-border/60"
            : "text-foreground-muted hover:text-foreground"
        )}
      >
        <Moon className={cn("w-3.5 h-3.5", isDark && mounted ? "text-primary" : "text-foreground-muted")} />
        <span>Dark Mode</span>
      </button>
    </div>
  );
}
