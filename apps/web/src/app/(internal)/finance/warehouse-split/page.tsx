"use client";

import { useState } from "react";
import {
  Warehouse,
  SplitSquareHorizontal,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  RotateCcw,
  ChevronRight,
  Package,
  Truck,
  Info,
  Save,
  XCircle,
  ArrowRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WarehouseAllocation {
  warehouseId: string;
  warehouseName: string;
  location: string;
  available: number;
  allocated: number;
  hasIssue?: boolean;
}

interface OrderItem {
  id: string;
  orderId: string;
  customer: string;
  product: string;
  requested: number;
  status: "pending" | "accepted" | "overridden";
  warehouses: WarehouseAllocation[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockOrders: OrderItem[] = [
  {
    id: "split-1",
    orderId: "ORD-4021",
    customer: "Acme Corp",
    product: "Dell Laptops",
    requested: 100,
    status: "pending",
    warehouses: [
      { warehouseId: "w-main", warehouseName: "Main Warehouse", location: "Mumbai", available: 60, allocated: 60 },
      { warehouseId: "w-east", warehouseName: "East Warehouse", location: "Kolkata", available: 40, allocated: 40 },
    ],
  },
  {
    id: "split-2",
    orderId: "ORD-4022",
    customer: "Globex Ltd",
    product: "HP Monitors",
    requested: 50,
    status: "pending",
    warehouses: [
      { warehouseId: "w-main", warehouseName: "Main Warehouse", location: "Mumbai", available: 30, allocated: 30 },
      { warehouseId: "w-north", warehouseName: "North Warehouse", location: "Delhi", available: 20, allocated: 20 },
    ],
  },
  {
    id: "split-3",
    orderId: "ORD-4023",
    customer: "Pinnacle Tech",
    product: "Cisco Routers",
    requested: 25,
    status: "accepted",
    warehouses: [
      { warehouseId: "w-main", warehouseName: "Main Warehouse", location: "Mumbai", available: 25, allocated: 25 },
    ],
  },
];

// ─── Color Helpers ────────────────────────────────────────────────────────────

const statusConfig = {
  pending: { label: "Pending Review", color: "bg-warning/10 text-warning border-warning/30" },
  accepted: { label: "Accepted", color: "bg-success/10 text-success border-success/30" },
  overridden: { label: "Manually Overridden", color: "bg-primary/10 text-primary border-primary/30" },
};

// ─── Allocation Bar ───────────────────────────────────────────────────────────

function AllocationBar({ allocated, total, hasIssue }: { allocated: number; total: number; hasIssue?: boolean }) {
  const pct = Math.min((allocated / total) * 100, 100);
  return (
    <div className="w-full bg-muted rounded-full h-1.5 mt-1.5">
      <div
        className={`h-1.5 rounded-full transition-all duration-500 ${hasIssue ? "bg-danger" : "bg-primary"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WarehouseSplitPage() {
  const [orders, setOrders] = useState<OrderItem[]>(mockOrders);
  const [selectedId, setSelectedId] = useState<string>(mockOrders[0].id);
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const selected = orders.find((o) => o.id === selectedId)!;

  const totalAllocated = selected.warehouses.reduce(
    (s, w) => s + (editMode ? (editValues[w.warehouseId] ?? w.allocated) : w.allocated),
    0
  );
  const isValid = totalAllocated === selected.requested;
  const diff = totalAllocated - selected.requested;

  function handleSelectOrder(id: string) {
    setSelectedId(id);
    setEditMode(false);
    setEditValues({});
    setSaveSuccess(false);
  }

  function handleStartEdit() {
    const vals: Record<string, number> = {};
    selected.warehouses.forEach((w) => { vals[w.warehouseId] = w.allocated; });
    setEditValues(vals);
    setEditMode(true);
    setSaveSuccess(false);
  }

  function handleCancelEdit() {
    setEditMode(false);
    setEditValues({});
  }

  function handleAcceptSuggested() {
    setOrders((prev) =>
      prev.map((o) => o.id === selectedId ? { ...o, status: "accepted" } : o)
    );
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  function handleSaveOverride() {
    if (!isValid) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedId
          ? {
              ...o,
              status: "overridden",
              warehouses: o.warehouses.map((w) => ({
                ...w,
                allocated: editValues[w.warehouseId] ?? w.allocated,
              })),
            }
          : o
      )
    );
    setEditMode(false);
    setEditValues({});
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  function handleResetSuggestion() {
    setOrders((prev) =>
      prev.map((o) => o.id === selectedId ? { ...o, status: "pending" } : o)
    );
    setEditMode(false);
    setEditValues({});
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <SplitSquareHorizontal className="w-6 h-6 text-primary" />
            Warehouse Split
          </h1>
          <p className="text-[13px] text-foreground-muted mt-1">
            Review AI-suggested stock splits and override manually when needed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-foreground-muted bg-muted px-3 py-1.5 rounded-md border border-border">
            <Package className="w-3.5 h-3.5" />
            {orders.filter((o) => o.status === "pending").length} pending splits
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {saveSuccess && (
        <div className="flex items-center gap-3 bg-success/10 border border-success/30 text-success rounded-lg px-4 py-3 text-[13px] font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Split allocation saved successfully and sent to fulfillment.
        </div>
      )}

      {/* Main Layout */}
      <div className="flex gap-5 flex-1 min-h-0">

        {/* Left: Order List */}
        <div className="w-72 shrink-0 flex flex-col bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="bg-muted px-4 py-3 text-[12px] font-semibold text-foreground-muted uppercase tracking-wider border-b border-border">
            Orders Requiring Split
          </div>
          <div className="flex-1 overflow-auto divide-y divide-border">
            {orders.map((order) => {
              const sc = statusConfig[order.status];
              const isActive = order.id === selectedId;
              return (
                <button
                  key={order.id}
                  onClick={() => handleSelectOrder(order.id)}
                  className={`w-full text-left px-4 py-3.5 transition-colors ${
                    isActive
                      ? "bg-primary/5 border-l-2 border-primary"
                      : "hover:bg-muted/50 border-l-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-foreground truncate">{order.customer}</span>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-colors ${isActive ? "text-primary" : "text-foreground-muted"}`} />
                  </div>
                  <p className="text-[11px] text-foreground-muted mt-0.5">{order.orderId} · {order.product}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-foreground-muted">
                      <span className="font-semibold text-foreground">{order.requested}</span> units
                    </span>
                    <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border ${sc.color}`}>
                      {sc.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Split Detail Panel */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">

          {/* Order Header Card */}
          <div className="bg-surface border border-border rounded-lg shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[15px] font-bold text-foreground">{selected.customer}</h2>
                  <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded border ${statusConfig[selected.status].color}`}>
                    {statusConfig[selected.status].label}
                  </span>
                </div>
                <p className="text-[13px] text-foreground-muted mt-1">
                  {selected.orderId} · {selected.product}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {selected.status !== "pending" && (
                  <button
                    onClick={handleResetSuggestion}
                    className="flex items-center gap-1.5 text-[12px] font-medium text-foreground-muted border border-border bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-md transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                )}
                {!editMode && selected.status === "pending" && (
                  <button
                    onClick={handleStartEdit}
                    className="flex items-center gap-1.5 text-[12px] font-medium text-foreground-muted border border-border bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-md transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Manual Override
                  </button>
                )}
                {!editMode && selected.status === "pending" && (
                  <button
                    onClick={handleAcceptSuggested}
                    className="flex items-center gap-1.5 text-[12px] font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Accept Suggested Split
                  </button>
                )}
              </div>
            </div>

            {/* Order Summary Bar */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="bg-muted rounded-md px-3 py-2.5">
                <p className="text-[10px] text-foreground-muted uppercase tracking-wider font-medium">Ordered</p>
                <p className="text-[18px] font-bold text-foreground mt-0.5">{selected.requested}</p>
                <p className="text-[10px] text-foreground-muted">units total</p>
              </div>
              <div className="bg-muted rounded-md px-3 py-2.5">
                <p className="text-[10px] text-foreground-muted uppercase tracking-wider font-medium">Warehouses</p>
                <p className="text-[18px] font-bold text-foreground mt-0.5">{selected.warehouses.length}</p>
                <p className="text-[10px] text-foreground-muted">fulfillment locations</p>
              </div>
              <div className={`rounded-md px-3 py-2.5 ${isValid || !editMode ? "bg-success/10" : "bg-danger/10"}`}>
                <p className="text-[10px] uppercase tracking-wider font-medium text-foreground-muted">Balance Check</p>
                <p className={`text-[18px] font-bold mt-0.5 ${isValid || !editMode ? "text-success" : "text-danger"}`}>
                  {editMode ? (diff === 0 ? "✓ OK" : diff > 0 ? `+${diff} over` : `${diff} short`) : "✓ OK"}
                </p>
                <p className="text-[10px] text-foreground-muted">{editMode ? "must match order" : "suggested match"}</p>
              </div>
            </div>
          </div>

          {/* Info Banner for edit mode */}
          {editMode && (
            <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 text-[13px] text-primary">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <span className="font-semibold">Manual Override Mode.</span> Adjust the quantities below. Total allocated must equal <strong>{selected.requested}</strong> units before you can save.
              </span>
            </div>
          )}

          {/* Warehouse Allocation Cards */}
          <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-foreground flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-foreground-muted" />
                {editMode ? "Override Allocation" : "Suggested Allocation"}
              </h3>
              <div className="flex items-center gap-1.5 text-[12px] text-foreground-muted">
                <Truck className="w-3.5 h-3.5" />
                Auto-generated by stock engine
              </div>
            </div>

            <div className="divide-y divide-border">
              {selected.warehouses.map((wh, idx) => {
                const currentAlloc = editMode ? (editValues[wh.warehouseId] ?? wh.allocated) : wh.allocated;
                const pct = Math.round((currentAlloc / selected.requested) * 100);

                return (
                  <div
                    key={wh.warehouseId}
                    className={`px-5 py-5 flex flex-col gap-3 transition-colors ${
                      wh.hasIssue ? "bg-danger/5" : "hover:bg-muted/30"
                    }`}
                  >
                    {/* Warehouse Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-md flex items-center justify-center text-[13px] font-bold shrink-0 ${
                          wh.hasIssue
                            ? "bg-danger/10 text-danger border border-danger/30"
                            : "bg-primary/10 text-primary border border-primary/20"
                        }`}>
                          W{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-foreground">{wh.warehouseName}</span>
                            {wh.hasIssue && (
                              <span className="flex items-center gap-1 text-[10px] font-bold bg-danger/10 text-danger border border-danger/20 px-1.5 py-0.5 rounded">
                                <AlertTriangle className="w-3 h-3" /> Shipping Issue
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-foreground-muted mt-0.5">{wh.location} · {wh.available} units available in stock</p>
                        </div>
                      </div>

                      {/* Allocation Input or Display */}
                      <div className="shrink-0 text-right">
                        {editMode ? (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2">
                              <label className="text-[11px] text-foreground-muted">Allocate:</label>
                              <input
                                type="number"
                                min={0}
                                max={wh.available}
                                value={editValues[wh.warehouseId] ?? wh.allocated}
                                onChange={(e) =>
                                  setEditValues((prev) => ({
                                    ...prev,
                                    [wh.warehouseId]: Math.max(0, parseInt(e.target.value) || 0),
                                  }))
                                }
                                className="w-20 text-right border border-border bg-muted rounded-md px-2 py-1 text-[13px] font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                              />
                              <span className="text-[12px] text-foreground-muted">units</span>
                            </div>
                            <p className="text-[10px] text-foreground-muted">max {wh.available}</p>
                          </div>
                        ) : (
                          <div>
                            <span className="text-[22px] font-bold text-foreground">{currentAlloc}</span>
                            <span className="text-[13px] text-foreground-muted ml-1">units</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] text-foreground-muted mb-1">
                        <span>{pct}% of order fulfilled from here</span>
                        <span>{currentAlloc} / {selected.requested}</span>
                      </div>
                      <AllocationBar allocated={currentAlloc} total={selected.requested} hasIssue={wh.hasIssue} />
                    </div>

                    {/* Split Arrow Indicator */}
                    {!editMode && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted bg-muted px-2.5 py-1 rounded-md border border-border">
                          <Package className="w-3 h-3" />
                          {wh.warehouseName}
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-foreground-muted" />
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-success bg-success/10 px-2.5 py-1 rounded-md border border-success/20">
                          <Truck className="w-3 h-3" />
                          {currentAlloc} units &#8594; Fulfillment
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Split Visual Summary */}
            {!editMode && (
              <div className="px-5 py-4 bg-muted/50 border-t border-border">
                <p className="text-[11px] text-foreground-muted uppercase tracking-wider font-semibold mb-3">Split Breakdown</p>
                <div className="flex items-center gap-0 h-6 rounded-full overflow-hidden w-full">
                  {selected.warehouses.map((wh, idx) => {
                    const pct = (wh.allocated / selected.requested) * 100;
                    const colors = ["bg-primary", "bg-success", "bg-warning", "bg-secondary"];
                    return (
                      <div
                        key={wh.warehouseId}
                        className={`h-full ${colors[idx % colors.length]} flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                        title={`${wh.warehouseName}: ${wh.allocated} units`}
                      >
                        {pct > 10 ? `${Math.round(pct)}%` : ""}
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                  {selected.warehouses.map((wh, idx) => {
                    const colors = ["text-primary", "text-success", "text-warning"];
                    const dots = ["bg-primary", "bg-success", "bg-warning"];
                    return (
                      <div key={wh.warehouseId} className="flex items-center gap-1.5 text-[11px] text-foreground-muted">
                        <div className={`w-2 h-2 rounded-full ${dots[idx % dots.length]}`} />
                        <span className={`font-semibold ${colors[idx % colors.length]}`}>{wh.allocated}</span>
                        <span>{wh.warehouseName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          {editMode && (
            <div className="bg-surface border border-border rounded-lg shadow-sm px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[13px]">
                {isValid ? (
                  <span className="flex items-center gap-1.5 text-success font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Total allocation matches order quantity ({selected.requested} units)
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-danger font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    {diff > 0
                      ? `Over-allocated by ${diff} units - reduce from a warehouse`
                      : `Under-allocated by ${Math.abs(diff)} units - add more`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-foreground-muted border border-border bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-md transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveOverride}
                  disabled={!isValid}
                  className={`flex items-center gap-1.5 text-[12px] font-semibold px-4 py-1.5 rounded-md transition-colors shadow-sm ${
                    isValid
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-foreground-muted cursor-not-allowed opacity-50"
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Override
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
