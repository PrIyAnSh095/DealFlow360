import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-[13px]">
      <div className="hidden md:block h-full z-20">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <Topbar />
        
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
