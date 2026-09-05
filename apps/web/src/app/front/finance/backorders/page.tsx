"use client";

import { useState } from "react";
import {
  PackageX,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Package,
  Warehouse,
  ChevronRight,
  ArrowRight,
  RefreshCcw,
  Filter,
  Search,
  Calendar,
  TrendingDown,
  CircleSlash,
} from "lucide-react";

type BackorderStatus = "waiting" | "partial" | "sourcing" | "cancelled";

interface WarehouseStock {
  name: string;
  location: string;
  available: number;
}

interface BackorderItem {
  id: string;
  orderId: string;
  customer: string;
  product: string;
  sku: string;
  ordered: number;
  shipped: number;
  pending: number;
  status: BackorderStatus;
  orderDate: string;
  eta: string | null;
  value: string;
  warehouses: WarehouseStock[];
}

const backorders: BackorderItem[] = [
  {
    id: "bo-1",
    orderId: "O-1001",
    customer: "Acme Corp",
    product: "Dell Latitude Laptops",
    sku: "DL-LAT-5540",
    ordered: 100,
    shipped: 80,
    pending: 20,
    status: "waiting",
    orderDate: "Sep 1, 2026",
    eta: "Sep 20, 2026",
    value: "4,20,000",
    warehouses: [
      { name: "Main Warehouse", location: "Mumbai", available: 60 },
      { name: "East Warehouse", location: "Kolkata", available: 20 },
    ],
  },
  {
    id: "bo-2",
    orderId: "O-1008",
    customer: "Globex Ltd",
    product: "HP 24 inch Monitors",
    sku: "HP-MON-24G",
    ordered: 50,
    shipped: 40,
    pending: 10,
    status: "partial",
    orderDate: "Sep 2, 2026",
    eta: "Sep 18, 2026",
    value: "85,000",
    warehouses: [
      { name: "Main Warehouse", location: "Mumbai", available: 30 },
      { name: "North Warehouse", location: "Delhi", available: 10 },
    ],
  },
  {
    id: "bo-3",
    orderId: "O-1015",
    customer: "Pinnacle Tech",
    product: "Cisco RV340 Routers",
    sku: "CS-RV340-K9",
    ordered: 30,
    shipped: 0,
    pending: 30,
    status: "sourcing",
    orderDate: "Sep 3, 2026",
    eta: null,
    value: "2,10,000",
    warehouses: [
      { name: "Main Warehouse", location: "Mumbai", available: 0 },
      { name: "West Warehouse", location: "Pune", available: 0 },
    ],
  },
  {
    id: "bo-4",
    orderId: "O-1019",
    customer: "Nexus Systems",
    product: "Logitech MX Keys Keyboards",
    sku: "LG-MX-KEYS",
    ordered: 75,
    shipped: 60,
    pending: 15,
    status: "waiting",
    orderDate: "Sep 4, 2026",
    eta: "Sep 16, 2026",
    value: "1,12,500",
    warehouses: [
      { name: "South Warehouse", location: "Bangalore", available: 15 },
    ],
  },
  {
    id: "bo-5",
    orderId: "O-1022",
    customer: "Initech",
    product: "Samsung 4K Smart TVs",
    sku: "SM-4K-65QN",
    ordered: 20,
    shipped: 20,
    pending: 0,
    status: "cancelled",
    orderDate: "Aug 30, 2026",
    eta: null,
    value: "6,40,000",
    warehouses: [
      { name: "Main Warehouse", location: "Mumbai", available: 5 },
    ],
  },
];

const statusConfig: Record<
  BackorderStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  waiting: {
    label: "Waiting",
    color: "bg-warning/10 text-warning border-warning/30",
    icon: Clock,
  },
  partial: {
    label: "Partial Ship",
    color: "bg-primary/10 text-primary border-primary/30",
    icon: Truck,
  },
  sourcing: {
    label: "Sourcing",
    color: "bg-danger/10 text-danger border-danger/30",
    icon: RefreshCcw,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-muted text-foreground-muted border-border",
    icon: CircleSlash,
  },
};

const summaryStats = [
  {
    label: "Total Backorders",
    value: "5",
    sub: "Active orders",
    color: "warning",
    icon: PackageX,
  },
  {
    label: "Units Pending",
    value: "75",
    sub: "Across 4 orders",
    color: "danger",
    icon: TrendingDown,
  },
  {
    label: "Value at Risk",
    value: "Rs 8.27L",
    sub: "Pending revenue",
    color: "warning",
    icon: AlertTriangle,
  },
  {
    label: "Avg ETA",
    value: "~18 days",
    sub: "To fulfillment",
    color: "primary",
    icon: Calendar,
  },
];

function getBg(c: string) {
  return c === "primary"
    ? "bg-primary/10"
    : c === "success"
    ? "bg-success/10"
    : c === "warning"
    ? "bg-warning/10"
    : c === "danger"
    ? "bg-danger/10"
    : "bg-muted";
}

function getText(c: string) {
  return c === "primary"
    ? "text-primary"
    : c === "success"
    ? "text-success"
    : c === "warning"
    ? "text-warning"
    : c === "danger"
    ? "text-danger"
    : "text-foreground";
}

function getBorder(c: string) {
  return c === "primary"
    ? "border-primary/20"
    : c === "success"
    ? "border-success/20"
    : c === "warning"
    ? "border-warning/20"
    : c === "danger"
    ? "border-danger/20"
    : "border-border";
}

function FulfillmentBar({
  shipped,
  ordered,
}: {
  shipped: number;
  ordered: number;
}) {
  const pct = ordered > 0 ? Math.min((shipped / ordered) * 100, 100) : 0;
  const remainingPct = 100 - pct;

  return (
    <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
      <div
        className="h-full bg-success rounded-l-full transition-all duration-500"
        style={{ width: pct + "%" }}
      />
      {remainingPct > 0 && (
        <div
          className="h-full bg-warning/40 rounded-r-full transition-all duration-500"
          style={{ width: remainingPct + "%" }}
        />
      )}
    </div>
  );
}

export default function BackordersPage() {
  const [selectedId, setSelectedId] = useState<string>(backorders[0].id);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const selected = backorders.find((b) => b.id === selectedId) || backorders[0];
  const filtered = backorders.filter((b) => {
    const q = search.toLowerCase();
    return (
      (b.orderId.toLowerCase().includes(q) ||
        b.customer.toLowerCase().includes(q) ||
        b.product.toLowerCase().includes(q)) &&
      (filterStatus === "all" || b.status === filterStatus)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <PackageX className="w-6 h-6 text-danger" /> Backorders
          </h1>
          <p className="text-[13px] text-foreground-muted mt-1">
            Track partially fulfilled orders and manage pending stock replenishment.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-foreground-muted bg-muted px-3 py-1.5 rounded-md border border-border">
            <Clock className="w-3.5 h-3.5" /> Last updated: just now
          </span>
          <span className="flex items-center gap-1.5 text-[12px] font-semibold bg-danger/10 text-danger border border-danger/30 px-3 py-1.5 rounded-md">
            <AlertTriangle className="w-3.5 h-3.5" /> 3 need attention
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {summaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-surface border border-border rounded-lg p-4 shadow-sm flex flex-col gap-3"
            >
              <div
                className={`w-8 h-8 rounded-md ${getBg(stat.color)} ${getBorder(
                  stat.color
                )} border flex items-center justify-center`}
              >
                <Icon className={`w-4 h-4 ${getText(stat.color)}`} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider leading-none mb-1">
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold ${getText(stat.color)}`}>
                  {stat.value}
                </p>
              </div>
              <p className="text-[11px] text-foreground-muted">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Main Layout */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* Left List */}
        <div className="w-80 shrink-0 flex flex-col bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
              <input
                type="text"
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded-md border border-border bg-muted text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>
            <div className="flex gap-1">
              {(["all", "waiting", "partial", "sourcing"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className={`flex-1 text-[10px] font-semibold uppercase py-1 rounded transition-colors ${
                    filterStatus === f
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground-muted hover:bg-muted"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto divide-y divide-border">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-foreground-muted">
                <Filter className="w-5 h-5 opacity-40" />
                <p className="text-[12px]">No results</p>
              </div>
            ) : (
              filtered.map((item) => {
                const sc = statusConfig[item.status];
                const SIcon = sc.icon;
                const isActive = item.id === selectedId;
                const pct =
                  item.ordered > 0
                    ? Math.round((item.shipped / item.ordered) * 100)
                    : 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full text-left px-4 py-3.5 transition-colors ${
                      isActive
                        ? "bg-primary/5 border-l-2 border-primary"
                        : "hover:bg-muted/50 border-l-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-foreground truncate">
                        {item.customer}
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? "text-primary" : "text-foreground-muted"
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-foreground-muted mt-0.5 truncate">
                      {item.orderId} - {item.product}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${sc.color}`}
                      >
                        <SIcon className="w-3 h-3" />
                        {sc.label}
                      </span>
                      <span className="text-[11px] text-foreground-muted">
                        <span className="font-semibold text-danger">
                          {item.pending}
                        </span>{" "}
                        pending
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-foreground-muted mb-1">
                        <span>{pct}% shipped</span>
                        <span>
                          {item.shipped}/{item.ordered}
                        </span>
                      </div>
                      <FulfillmentBar
                        shipped={item.shipped}
                        ordered={item.ordered}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-border bg-muted/40 flex items-center justify-between">
            <span className="text-[11px] text-foreground-muted">
              {filtered.length} backorder{filtered.length !== 1 ? "s" : ""}
            </span>
            <span className="text-[11px] font-semibold text-danger">
              {filtered
                .filter((b) => b.status !== "cancelled")
                .reduce((s, b) => s + b.pending, 0)}{" "}
              units pending
            </span>
          </div>
        </div>

        {/* Right Detail */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          {/* Order Card */}
          <div className="bg-surface border border-border rounded-lg shadow-sm p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[15px] font-bold text-foreground">
                    {selected.customer}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded border ${
                      statusConfig[selected.status].color
                    }`}
                  >
                    {(() => {
                      const I = statusConfig[selected.status].icon;
                      return <I className="w-3 h-3" />;
                    })()}
                    {statusConfig[selected.status].label}
                  </span>
                </div>
                <p className="text-[13px] text-foreground-muted mt-1">
                  {selected.orderId} - {selected.product}{" "}
                  <span className="ml-1 text-[11px] bg-muted px-1.5 py-0.5 rounded border border-border font-mono">
                    {selected.sku}
                  </span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] text-foreground-muted uppercase tracking-wider font-medium">
                  Order Value
                </p>
                <p className="text-[20px] font-bold text-foreground mt-0.5">
                  Rs. {selected.value}
                </p>
                <p className="text-[11px] text-foreground-muted">
                  Placed {selected.orderDate}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-3">
              <div className="bg-muted rounded-md px-3 py-2.5">
                <p className="text-[10px] text-foreground-muted uppercase tracking-wider font-medium">
                  Ordered
                </p>
                <p className="text-[20px] font-bold text-foreground mt-0.5">
                  {selected.ordered}
                </p>
                <p className="text-[10px] text-foreground-muted">units total</p>
              </div>
              <div className="bg-success/10 border border-success/20 rounded-md px-3 py-2.5">
                <p className="text-[10px] text-foreground-muted uppercase tracking-wider font-medium">
                  Shipped
                </p>
                <p className="text-[20px] font-bold text-success mt-0.5">
                  {selected.shipped}
                </p>
                <p className="text-[10px] text-foreground-muted">dispatched</p>
              </div>
              <div className="bg-warning/10 border border-warning/20 rounded-md px-3 py-2.5">
                <p className="text-[10px] text-foreground-muted uppercase tracking-wider font-medium">
                  Pending
                </p>
                <p className="text-[20px] font-bold text-warning mt-0.5">
                  {selected.pending}
                </p>
                <p className="text-[10px] text-foreground-muted">
                  on backorder
                </p>
              </div>
              <div className="bg-muted rounded-md px-3 py-2.5">
                <p className="text-[10px] text-foreground-muted uppercase tracking-wider font-medium">
                  ETA
                </p>
                <p
                  className={`text-[14px] font-bold mt-0.5 ${
                    selected.eta ? "text-foreground" : "text-danger"
                  }`}
                >
                  {selected.eta ?? "Unknown"}
                </p>
                <p className="text-[10px] text-foreground-muted">
                  expected restock
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-[12px] text-foreground-muted mb-2">
                <span className="font-medium">Fulfillment Progress</span>
                <span>
                  <span className="font-semibold text-success">
                    {selected.shipped}
                  </span>{" "}
                  shipped -{" "}
                  <span className="font-semibold text-warning">
                    {selected.pending}
                  </span>{" "}
                  remaining
                </span>
              </div>
              <FulfillmentBar
                shipped={selected.shipped}
                ordered={selected.ordered}
              />
              <div className="flex justify-between text-[10px] text-foreground-muted mt-1.5">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success inline-block" />{" "}
                  Shipped
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-warning/40 inline-block" />{" "}
                  Pending backorder
                </span>
              </div>
            </div>
          </div>

          {/* Warehouse Stock */}
          <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-foreground flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-foreground-muted" /> Warehouse
                Stock Availability
              </h3>
              <span className="text-[11px] text-foreground-muted">
                Total ordered:{" "}
                <span className="font-semibold text-foreground">
                  {selected.ordered} units
                </span>
              </span>
            </div>
            <div className="divide-y divide-border">
              {selected.warehouses.map((wh, idx) => {
                const pct =
                  selected.ordered > 0
                    ? Math.min((wh.available / selected.ordered) * 100, 100)
                    : 0;
                const barC = ["bg-primary", "bg-success", "bg-warning"];
                const txtC = ["text-primary", "text-success", "text-warning"];
                const bdrC = [
                  "border-primary/20",
                  "border-success/20",
                  "border-warning/20",
                ];
                const bgC = ["bg-primary/10", "bg-success/10", "bg-warning/10"];
                return (
                  <div
                    key={idx}
                    className="px-5 py-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-md flex items-center justify-center text-[12px] font-bold shrink-0 ${
                            bgC[idx % bgC.length]
                          } ${txtC[idx % txtC.length]} border ${
                            bdrC[idx % bdrC.length]
                          }`}
                        >
                          {`W${idx + 1}`}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-foreground">
                            {wh.name}
                          </p>
                          <p className="text-[11px] text-foreground-muted">
                            {wh.location}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={`text-[22px] font-bold ${
                            wh.available === 0
                              ? "text-danger"
                              : wh.available < 20
                              ? "text-warning"
                              : "text-foreground"
                          }`}
                        >
                          {wh.available}
                        </p>
                        <p className="text-[11px] text-foreground-muted">
                          units available
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] text-foreground-muted mb-1.5">
                        <span>
                          {Math.round(pct)}% of order can be filled
                        </span>
                        <span>
                          {wh.available} / {selected.ordered}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            wh.available === 0
                              ? "bg-danger"
                              : barC[idx % barC.length]
                          }`}
                          style={{ width: pct + "%" }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted bg-muted px-2.5 py-1 rounded-md border border-border">
                        <Package className="w-3 h-3" />
                        {wh.name}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-foreground-muted" />
                      {wh.available > 0 ? (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-success bg-success/10 px-2.5 py-1 rounded-md border border-success/20">
                          <Truck className="w-3 h-3" />
                          {wh.available} units to Fulfillment
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-danger bg-danger/10 px-2.5 py-1 rounded-md border border-danger/20">
                          <CircleSlash className="w-3 h-3" />
                          Out of stock
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {selected.pending > 0 && (
              <div className="px-5 py-4 bg-warning/5 border-t border-warning/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">
                      Stock Gap Detected
                    </p>
                    <p className="text-[12px] text-foreground-muted mt-0.5">
                      Available:{" "}
                      <span className="font-semibold text-foreground">
                        {selected.warehouses.reduce(
                          (s, w) => s + w.available,
                          0
                        )}{" "}
                        units
                      </span>{" "}
                      vs order of{" "}
                      <span className="font-semibold text-foreground">
                        {selected.ordered} units
                      </span>
                      .{" "}
                      <span className="font-semibold text-warning">
                        {selected.pending} units
                      </span>{" "}
                      on backorder
                      {selected.eta
                        ? " - ETA " + selected.eta
                        : " - ETA unknown"}
                      .
                    </p>
                  </div>
                </div>
              </div>
            )}
            {selected.pending === 0 && (
              <div className="px-5 py-4 bg-success/5 border-t border-success/20">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  <p className="text-[13px] font-medium text-success">
                    All units shipped. No active backorder.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick View Table */}
          <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-foreground flex items-center gap-2">
                <PackageX className="w-4 h-4 text-foreground-muted" /> All
                Backorders
              </h3>
              <span className="text-[11px] bg-danger/10 text-danger border border-danger/20 px-2 py-0.5 rounded-full font-semibold">
                {backorders.filter((b) => b.status !== "cancelled").length}{" "}
                active
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">
                    <th className="px-5 py-3 font-medium">Order</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Product</th>
                    <th className="px-5 py-3 font-medium text-center">Ordered</th>
                    <th className="px-5 py-3 font-medium text-center">Shipped</th>
                    <th className="px-5 py-3 font-medium text-center">Pending</th>
                    <th className="px-5 py-3 font-medium text-center">ETA</th>
                    <th className="px-5 py-3 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] divide-y divide-border">
                  {backorders.map((item) => {
                    const sc = statusConfig[item.status];
                    const SIcon = sc.icon;
                    const isActive = item.id === selectedId;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`cursor-pointer transition-colors ${
                          isActive ? "bg-primary/5" : "hover:bg-muted/40"
                        }`}
                      >
                        <td className="px-5 py-3 font-medium text-primary">
                          {item.orderId}
                        </td>
                        <td className="px-5 py-3 text-foreground font-medium">
                          {item.customer}
                        </td>
                        <td className="px-5 py-3 text-foreground-muted">
                          {item.product}
                        </td>
                        <td className="px-5 py-3 text-center font-medium text-foreground">
                          {item.ordered}
                        </td>
                        <td className="px-5 py-3 text-center font-semibold text-success">
                          {item.shipped}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={`font-bold ${
                              item.pending === 0
                                ? "text-success"
                                : item.pending > 15
                                ? "text-danger"
                                : "text-warning"
                            }`}
                          >
                            {item.pending}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center text-foreground-muted text-[12px]">
                          {item.eta ?? (
                            <span className="text-danger font-medium">
                              Unknown
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${sc.color}`}
                          >
                            <SIcon className="w-3 h-3" />
                            {sc.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
