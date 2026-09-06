"use client";

import { useState, useEffect } from "react";
import {
  Warehouse,
  SplitSquareHorizontal,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Package,
  Truck,
  DollarSign,
  Zap,
  Layers,
  Star,
  Wifi,
  WifiOff,
  ArrowRight,
  RotateCcw,
  Edit3,
  X,
  Clock,
  FileText,
} from "lucide-react";
import WarehouseAIModal from "@/components/WarehouseAIModal";
import { operationsApi } from "@/features/operations/api";
import { Order, FulfillmentPlan } from "@/features/operations/types";
import { useOrgConfig, formatCurrency } from "@/features/customer/useOrgConfig";

// ─── Tag Config ───────────────────────────────────────────────────────────────

const TAG_CONFIG: Record<string, { icon: React.ReactNode; color: string; badge: string }> = {
  Recommended: {
    icon: <Star className="w-3.5 h-3.5" />,
    color: "border-primary/30 bg-primary/5",
    badge: "bg-primary text-primary-foreground",
  },
  "Lowest Cost": {
    icon: <DollarSign className="w-3.5 h-3.5" />,
    color: "border-success/30 bg-success/5",
    badge: "bg-success text-white",
  },
  Fastest: {
    icon: <Zap className="w-3.5 h-3.5" />,
    color: "border-warning/30 bg-warning/5",
    badge: "bg-warning text-white",
  },
  "Fewest Shipments": {
    icon: <Layers className="w-3.5 h-3.5" />,
    color: "border-purple-500/30 bg-purple-500/5",
    badge: "bg-purple-600 text-white",
  },
};

function getTagConfig(tag: string) {
  return TAG_CONFIG[tag] ?? TAG_CONFIG["Fewest Shipments"];
}

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending_fulfillment: { label: "Pending Fulfillment", color: "bg-warning/10 text-warning border-warning/30" },
  processing: { label: "Processing", color: "bg-primary/10 text-primary border-primary/30" },
  partially_shipped: { label: "Partially Shipped", color: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
  shipped: { label: "Shipped / In Transit", color: "bg-primary/10 text-primary border-primary/30" },
  delivered: { label: "Delivered", color: "bg-success/10 text-success border-success/30" },
  fulfilled: { label: "Fulfilled", color: "bg-success/10 text-success border-success/30" },
  cancelled: { label: "Cancelled", color: "bg-danger/10 text-danger border-danger/30" },
};

function getOrderStatusBadge(status: string) {
  const cfg = ORDER_STATUS_CONFIG[status] ?? {
    label: status.replace(/_/g, " "),
    color: "bg-muted text-foreground-muted border-border",
  };
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── Shipping Adapter Badge ───────────────────────────────────────────────────

function ShippingAdapterBadge({ adapter }: { adapter?: string }) {
  const isLive = adapter === "Shiprocket";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${
        isLive
          ? "bg-success/10 text-success border-success/30"
          : "bg-muted text-foreground-muted border-border"
      }`}
    >
      {isLive ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
      {isLive ? "Live (Shiprocket)" : "Internal Rate Card"}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WarehouseSplitPage() {
  const orgConfig = useOrgConfig();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [plans, setPlans] = useState<FulfillmentPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<FulfillmentPlan | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState<any>(null);

  // Status Edit Modal state for Sales Reps
  const [isEditStatusModalOpen, setIsEditStatusModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState("pending_fulfillment");
  const [editCarrier, setEditCarrier] = useState("");
  const [editTrackingNumber, setEditTrackingNumber] = useState("");
  const [editEstimatedDelivery, setEditEstimatedDelivery] = useState("");
  const [editDeliveryNotes, setEditDeliveryNotes] = useState("");
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [statusSaveSuccess, setStatusSaveSuccess] = useState(false);

  // Load all orders on mount
  useEffect(() => {
    async function loadOrders() {
      try {
        const fetched = await operationsApi.getOrders();
        const ordersList = Array.isArray(fetched) ? fetched : [];
        setAllOrders(ordersList);
        if (ordersList.length > 0) {
          setSelectedOrderId(ordersList[0].id);
        }
      } catch (err) {
        console.error("Failed to load orders", err);
      } finally {
        setIsLoadingOrders(false);
      }
    }
    loadOrders();
  }, []);

  const filteredOrders = allOrders.filter((o) => {
    if (statusFilter === "pending") return o.status === "pending_fulfillment";
    if (statusFilter === "shipped") return o.status === "shipped" || o.status === "processing" || o.status === "partially_shipped";
    if (statusFilter === "delivered") return o.status === "delivered" || o.status === "fulfilled";
    return true;
  });

  // Load plans whenever selected order changes
  useEffect(() => {
    if (!selectedOrderId) {
      setPlans([]);
      setSelectedPlan(null);
      return;
    }
    setIsLoadingPlans(true);
    setPlans([]);
    setSelectedPlan(null);
    setApplySuccess(false);
    setApplyError(null);

    operationsApi
      .getFulfillmentPlans(selectedOrderId)
      .then((resp) => {
        const plansList = resp?.plans ?? [];
        setPlans(plansList);
        // Auto-select the Recommended plan
        const recommended = plansList.find((p) => p.tag === "Recommended") ?? plansList[0] ?? null;
        setSelectedPlan(recommended);
      })
      .catch((err) => {
        console.error("Failed to load fulfillment plans", err);
        setPlans([]);
      })
      .finally(() => setIsLoadingPlans(false));
  }, [selectedOrderId]);

  const selectedOrder = allOrders.find((o) => o.id === selectedOrderId) ?? null;

  const openEditStatusModal = () => {
    if (!selectedOrder) return;
    setEditStatus(selectedOrder.status || "pending_fulfillment");
    setEditCarrier(selectedOrder.carrier || "");
    setEditTrackingNumber(selectedOrder.tracking_number || "");
    setEditEstimatedDelivery(selectedOrder.estimated_delivery || "");
    setEditDeliveryNotes(selectedOrder.delivery_notes || "");
    setStatusSaveSuccess(false);
    setIsEditStatusModalOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedOrderId) return;
    setIsSavingStatus(true);
    try {
      const updated = await operationsApi.updateOrderStatus(selectedOrderId, {
        status: editStatus,
        carrier: editCarrier,
        tracking_number: editTrackingNumber,
        estimated_delivery: editEstimatedDelivery,
        delivery_notes: editDeliveryNotes,
      });

      setAllOrders((prev) =>
        prev.map((o) => (o.id === selectedOrderId ? { ...o, ...updated } : o))
      );
      setStatusSaveSuccess(true);
      setTimeout(() => setIsEditStatusModalOpen(false), 1200);
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setIsSavingStatus(false);
    }
  };

  async function handleApplyPlan() {
    if (!selectedPlan || !selectedOrderId) return;
    setIsApplying(true);
    setApplyError(null);
    try {
      await operationsApi.applyFulfillmentPlan(selectedOrderId, selectedPlan);
      setApplySuccess(true);

      // Refresh orders list status from backend
      const refreshed = await operationsApi.getOrders();
      setAllOrders(Array.isArray(refreshed) ? refreshed : []);
    } catch (err: any) {
      setApplyError(err?.response?.data?.detail ?? "Failed to apply plan. Please try again.");
    } finally {
      setIsApplying(false);
    }
  }

  async function handleOpenAi() {
    if (!selectedOrderId) return;
    setIsAiModalOpen(true);
    setAiLoading(true);
    try {
      const res = await fetch(`/api/v1/operations/fulfillment/${selectedOrderId}/ai-explanation`, {
        method: "POST",
      });
      setAiData(res.ok ? await res.json() : null);
    } catch {
      setAiData(null);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <SplitSquareHorizontal className="w-6 h-6 text-primary" />
            Warehouse Split & Order Fulfillment
          </h1>
          <p className="text-[13px] text-foreground-muted mt-1">
            Manage multi-warehouse stock allocations, rank fulfillment plans, and update delivery status directly in PostgreSQL.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-foreground-muted bg-muted px-3 py-1.5 rounded-md border border-border">
            <Package className="w-3.5 h-3.5" />
            {allOrders.length} total {allOrders.length === 1 ? "order" : "orders"}
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 flex-wrap">
        {[
          { id: "all", label: "All Orders" },
          { id: "pending", label: "Pending Fulfillment" },
          { id: "shipped", label: "Processing & Shipped" },
          { id: "delivered", label: "Delivered & Fulfilled" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${
              statusFilter === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-foreground-muted hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toasts */}
      {applySuccess && (
        <div className="flex items-center gap-3 bg-success/10 border border-success/30 text-success rounded-lg px-4 py-3 text-[13px] font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Fulfillment plan applied. Stock allocations and order status updated in the database.
        </div>
      )}
      {applyError && (
        <div className="flex items-center gap-3 bg-danger/10 border border-danger/30 text-danger rounded-lg px-4 py-3 text-[13px] font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {applyError}
        </div>
      )}

      {/* Main Layout */}
      <div className="flex gap-5 flex-1 min-h-0">

        {/* ─── Left: Order List ──────────────────────────────────────────── */}
        <div className="w-72 shrink-0 flex flex-col bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="bg-muted px-4 py-3 text-[12px] font-semibold text-foreground-muted uppercase tracking-wider border-b border-border flex items-center justify-between">
            <span>Orders List</span>
            <span className="text-[11px] font-normal text-foreground-muted">({filteredOrders.length})</span>
          </div>
          <div className="flex-1 overflow-auto divide-y divide-border">
            {isLoadingOrders ? (
              <div className="p-8 text-center text-[13px] text-foreground-muted">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-foreground-muted">
                No orders match selected filter.
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isActive = order.id === selectedOrderId;
                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full text-left px-4 py-3.5 transition-colors ${
                      isActive
                        ? "bg-primary/5 border-l-2 border-primary"
                        : "hover:bg-muted/50 border-l-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-foreground truncate">
                        {order.customer_name || "Unknown Customer"}
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-primary" : "text-foreground-muted"}`}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-[11px] text-foreground-muted truncate">
                        {order.id.slice(0, 8)} · {order.deal_name || "Deal"}
                      </span>
                      {getOrderStatusBadge(order.status)}
                    </div>
                    <p className="text-[10px] text-foreground-muted mt-1">
                      Created {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ─── Right: Plan Selection & Order Details ──────────────────────── */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          {!selectedOrder && !isLoadingOrders && (
            <div className="flex flex-col items-center justify-center bg-surface border border-border rounded-lg shadow-sm p-12 text-center h-[50vh]">
              <Warehouse className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-foreground-muted text-[13px]">
                Select an order to view stock fulfillment plans and update status.
              </p>
            </div>
          )}

          {selectedOrder && (
            <>
              {/* Order Header Card */}
              <div className="bg-surface border border-border rounded-lg shadow-sm p-5 space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-[16px] font-bold text-foreground">
                        {selectedOrder.customer_name || "Unknown Customer"}
                      </h2>
                      {getOrderStatusBadge(selectedOrder.status)}
                    </div>
                    <p className="text-[13px] text-foreground-muted mt-0.5">
                      Order ID: <code className="font-mono">{selectedOrder.id}</code> · {selectedOrder.deal_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={openEditStatusModal}
                      className="flex items-center gap-1.5 text-[12px] font-bold bg-muted text-foreground hover:bg-muted/80 border border-border px-3 py-1.5 rounded-md transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Delivery Status
                    </button>
                    <button
                      onClick={handleOpenAi}
                      className="flex items-center gap-1.5 text-[12px] font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground px-3 py-1.5 rounded-md transition-colors"
                    >
                      AI Analysis
                    </button>
                  </div>
                </div>

                {/* Delivery & Tracking Info Summary */}
                {(selectedOrder.carrier || selectedOrder.tracking_number || selectedOrder.estimated_delivery) && (
                  <div className="pt-3 border-t border-border flex flex-wrap gap-4 text-[12px] text-foreground-muted">
                    {selectedOrder.carrier && (
                      <span className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-primary" />
                        <strong>Carrier:</strong> {selectedOrder.carrier}
                      </span>
                    )}
                    {selectedOrder.tracking_number && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                        <strong>Tracking #:</strong> <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{selectedOrder.tracking_number}</code>
                      </span>
                    )}
                    {selectedOrder.estimated_delivery && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <strong>Estimated Delivery:</strong> {selectedOrder.estimated_delivery}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Plans loading */}
              {isLoadingPlans && (
                <div className="bg-surface border border-border rounded-lg p-8 text-center text-[13px] text-foreground-muted">
                  Generating fulfillment plans from live stock data...
                </div>
              )}

              {/* No plans */}
              {!isLoadingPlans && plans.length === 0 && (
                <div className="bg-surface border border-border rounded-lg p-8 text-center text-[13px] text-foreground-muted">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-warning/50" />
                  No feasible fulfillment plans available. Insufficient stock across all warehouses.
                </div>
              )}

              {/* Plan Cards */}
              {!isLoadingPlans && plans.length > 0 && (
                <>
                  <div className="bg-muted/50 border border-border rounded-lg px-4 py-3 text-[13px] text-foreground-muted">
                    <strong className="text-foreground">
                      {plans.length} plan{plans.length !== 1 ? "s" : ""}
                    </strong>{" "}
                    generated from real warehouse stock. Select the best option and click Apply.
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {plans.map((plan) => {
                      const tagCfg = getTagConfig(plan.tag);
                      const isSelected = selectedPlan?.plan_id === plan.plan_id;
                      return (
                        <button
                          key={plan.plan_id}
                          onClick={() => setSelectedPlan(plan)}
                          className={`text-left w-full rounded-lg border p-5 transition-all shadow-sm ${
                            isSelected
                              ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                              : `${tagCfg.color} hover:shadow-md`
                          }`}
                        >
                          {/* Plan Header */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${tagCfg.badge}`}
                              >
                                {tagCfg.icon}
                                {plan.tag}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] font-bold text-primary">SELECTED</span>
                              )}
                            </div>
                            <ShippingAdapterBadge adapter={plan.shipping_adapter} />
                          </div>
                          <p className="text-[13px] font-semibold text-foreground mb-3">{plan.name}</p>

                          {/* Key metrics grid */}
                          <div className="grid grid-cols-2 gap-2 text-[12px]">
                            <div className="bg-background/60 rounded-md px-2.5 py-2">
                              <p className="text-foreground-muted text-[10px] uppercase tracking-wide">Shipping</p>
                              <p className="font-bold text-foreground">{formatCurrency(plan.shipping_cost, orgConfig)}</p>
                            </div>
                            <div className="bg-background/60 rounded-md px-2.5 py-2">
                              <p className="text-foreground-muted text-[10px] uppercase tracking-wide">Total Cost</p>
                              <p className="font-bold text-foreground">{formatCurrency(plan.total_order_cost, orgConfig)}</p>
                            </div>
                            <div className="bg-background/60 rounded-md px-2.5 py-2">
                              <p className="text-foreground-muted text-[10px] uppercase tracking-wide">Margin</p>
                              <p
                                className={`font-bold ${
                                  plan.margin_percentage >= 20
                                    ? "text-success"
                                    : plan.margin_percentage >= 10
                                    ? "text-warning"
                                    : "text-danger"
                                }`}
                              >
                                {plan.margin_percentage.toFixed(1)}%
                              </p>
                            </div>
                            <div className="bg-background/60 rounded-md px-2.5 py-2">
                              <p className="text-foreground-muted text-[10px] uppercase tracking-wide">ETA</p>
                              <p className="font-bold text-foreground">{plan.eta}</p>
                            </div>
                          </div>

                          {/* Warehouses used */}
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {plan.warehouses_used.map((wh) => (
                              <span
                                key={wh}
                                className="text-[10px] bg-muted border border-border text-foreground-muted px-1.5 py-0.5 rounded flex items-center gap-1"
                              >
                                <Truck className="w-2.5 h-2.5" />
                                {wh}
                              </span>
                            ))}
                            {plan.backorders.length > 0 && (
                              <span className="text-[10px] bg-danger/10 border border-danger/20 text-danger px-1.5 py-0.5 rounded">
                                {plan.backorders.length} backorder{plan.backorders.length > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>

                          {/* Allocations detail */}
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-2">
                              Line Allocations
                            </p>
                            <div className="space-y-1">
                              {plan.allocations.slice(0, 3).map((alloc, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-[11px]">
                                  <Package className="w-2.5 h-2.5 text-foreground-muted shrink-0" />
                                  <span className="text-foreground-muted truncate">{alloc.product_name}</span>
                                  <ArrowRight className="w-2.5 h-2.5 text-foreground-muted shrink-0" />
                                  <span className="font-semibold text-foreground shrink-0">
                                    {alloc.quantity} from {alloc.warehouse_name}
                                  </span>
                                </div>
                              ))}
                              {plan.allocations.length > 3 && (
                                <p className="text-[10px] text-foreground-muted">
                                  +{plan.allocations.length - 3} more lines
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Apply Footer */}
                  {selectedPlan && (
                    <div className="bg-surface border border-border rounded-lg shadow-sm px-5 py-4 flex items-center justify-between gap-4">
                      <div className="text-[13px]">
                        <span className="text-foreground-muted">Applying: </span>
                        <span className="font-semibold text-foreground">{selectedPlan.name}</span>
                        <span className="text-foreground-muted ml-2">
                          · Margin {selectedPlan.margin_percentage.toFixed(1)}% · {selectedPlan.num_shipments}{" "}
                          shipment{selectedPlan.num_shipments !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setSelectedPlan(plans.find((p) => p.tag === "Recommended") ?? plans[0])}
                          className="flex items-center gap-1.5 text-[12px] font-medium text-foreground-muted border border-border bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-md transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reset
                        </button>
                        <button
                          onClick={handleApplyPlan}
                          disabled={isApplying}
                          className="flex items-center gap-1.5 text-[12px] font-semibold bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isApplying ? "Applying..." : "Apply Plan"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Order & Delivery Status Modal for Sales Reps */}
      {isEditStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-[16px] font-bold text-foreground">Edit Delivery & Order Status</h3>
              <button
                onClick={() => setIsEditStatusModalOpen(false)}
                className="p-1 text-foreground-muted hover:text-foreground rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {statusSaveSuccess && (
              <div className="p-3 bg-success/10 border border-success/30 text-success text-[12px] font-medium rounded-md flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Order status and delivery info updated in database!
              </div>
            )}

            <div className="space-y-4 text-[13px]">
              <div>
                <label className="block font-semibold text-foreground mb-1">Fulfillment / Delivery Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-primary/30"
                >
                  <option value="pending_fulfillment">Pending Fulfillment</option>
                  <option value="processing">Processing</option>
                  <option value="partially_shipped">Partially Shipped</option>
                  <option value="shipped">Shipped / In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Carrier / Courier Name</label>
                <input
                  type="text"
                  placeholder="e.g. Shiprocket, BlueDart, FedEx"
                  value={editCarrier}
                  onChange={(e) => setEditCarrier(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Tracking Number</label>
                <input
                  type="text"
                  placeholder="e.g. SR-94021840"
                  value={editTrackingNumber}
                  onChange={(e) => setEditTrackingNumber(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px] font-mono focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Estimated Delivery Date / ETA</label>
                <input
                  type="text"
                  placeholder="e.g. 2026-09-12 or 2-3 Days"
                  value={editEstimatedDelivery}
                  onChange={(e) => setEditEstimatedDelivery(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Delivery Notes</label>
                <textarea
                  rows={2}
                  placeholder="Special instructions or notes..."
                  value={editDeliveryNotes}
                  onChange={(e) => setEditDeliveryNotes(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px] focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setIsEditStatusModalOpen(false)}
                className="px-4 py-1.5 rounded-md border border-border bg-muted text-[12px] font-medium text-foreground-muted hover:bg-muted/80"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStatus}
                disabled={isSavingStatus}
                className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 disabled:opacity-60"
              >
                {isSavingStatus ? "Saving..." : "Save to Database"}
              </button>
            </div>
          </div>
        </div>
      )}

      <WarehouseAIModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        isLoading={aiLoading}
        data={aiData}
        orderId={selectedOrder?.id || ""}
      />
    </div>
  );
}
