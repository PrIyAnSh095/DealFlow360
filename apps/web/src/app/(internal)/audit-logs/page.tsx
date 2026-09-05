"use client";

import { useAuth } from "@/features/auth/auth-context";
import { useEffect, useState } from "react";
import { ShieldAlert, History } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { format } from "date-fns";

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "admin") return;
    
    const fetchLogs = async () => {
      try {
        const res = await apiClient.get(`/admin/audit-logs`);
        setLogs(res.data);
      } catch (err) {
        console.error("Failed to load audit logs", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [user]);

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <ShieldAlert className="w-12 h-12 text-danger" />
        <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
        <p className="text-[13px] text-foreground-muted">You do not have permission to view audit logs.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Audit Logs</h1>
          <p className="text-[13px] text-foreground-muted mt-1">Immutable record of critical system actions.</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-[12px] font-semibold text-foreground-muted uppercase tracking-wider">
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Entity Type</th>
                <th className="px-5 py-3">Entity ID</th>
                <th className="px-5 py-3">Actor ID</th>
              </tr>
            </thead>
            <tbody className="text-[13px] divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-foreground-muted">Loading logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-foreground-muted">No audit logs found.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3 text-foreground-muted whitespace-nowrap">
                      {format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}
                    </td>
                    <td className="px-5 py-3 font-medium text-foreground">
                      <span className="px-2 py-1 bg-muted rounded-md border border-border/50 text-[11px]">{log.action}</span>
                    </td>
                    <td className="px-5 py-3 text-foreground-muted">{log.entity_type}</td>
                    <td className="px-5 py-3 text-foreground-muted font-mono text-[11px]">{log.entity_id || "-"}</td>
                    <td className="px-5 py-3 text-foreground-muted font-mono text-[11px]">{log.actor_id || "System"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
