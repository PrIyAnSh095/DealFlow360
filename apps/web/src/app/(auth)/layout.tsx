import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Subtle branded background element */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl -z-10 pointer-events-none" />

      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center font-bold text-primary-foreground text-sm">
            D
          </div>
          <span className="font-semibold text-[15px] tracking-tight">DealFlow360</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto z-10">
        <div className="w-full bg-surface border border-border shadow-sm rounded-xl p-8 sm:p-10">
          {children}
        </div>
        <div className="mt-8 text-center text-[12px] text-foreground-muted">
          © {new Date().getFullYear()} DealFlow360. Internal Operations.
        </div>
      </main>
    </div>
  );
}
