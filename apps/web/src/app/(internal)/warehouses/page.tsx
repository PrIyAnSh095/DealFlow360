"use client";

import { useWarehouses } from "@/features/operations/hooks";
import { Warehouse as WarehouseIcon, MapPin, Package } from "lucide-react";

export default function WarehousesPage() {
  const { data: warehouses, isLoading } = useWarehouses();

  if (isLoading) {
    return <div className="p-8 text-[13px] text-foreground-muted">Loading warehouses...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <WarehouseIcon className="w-6 h-6 text-primary" />
            Warehouses & Locations
          </h1>
          <p className="text-sm text-foreground-muted mt-1">Manage physical inventory locations and zones.</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm flex-1 overflow-hidden flex flex-col">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-muted text-foreground-muted border-b border-border">
            <tr>
              <th className="px-5 py-3 font-medium">Warehouse Code</th>
              <th className="px-5 py-3 font-medium">Location Name</th>
              <th className="px-5 py-3 font-medium">Region</th>
              <th className="px-5 py-3 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {warehouses?.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-foreground-muted">
                  No warehouses found.
                </td>
              </tr>
            ) : (
              warehouses?.map(w => (
                <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-4 h-4 text-foreground-muted" />
                    WH-{w.id.slice(0,6)}
                  </td>
                  <td className="px-5 py-3 font-medium">{w.name}</td>
                  <td className="px-5 py-3 text-foreground-muted flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {w.location}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-success/10 text-success">
                      Active
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
