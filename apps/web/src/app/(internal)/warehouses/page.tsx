"use client";

import { useState } from "react";
import {
  useWarehouses,
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
  useWarehouseStock,
  useUpdateStock
} from "@/features/operations/hooks";
import { Warehouse as WarehouseIcon, MapPin, Package, Plus, Edit2, Power, Layers, Save, X } from "lucide-react";
import { Warehouse, StockItem } from "@/features/operations/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function WarehousesPage() {
  const { data: warehouses, isLoading } = useWarehouses();
  const createWarehouseMutation = useCreateWarehouse();
  const updateWarehouseMutation = useUpdateWarehouse();
  const deleteWarehouseMutation = useDeleteWarehouse();

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [stockWarehouse, setStockWarehouse] = useState<Warehouse | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Warehouse>>({
    name: "",
    location: "",
    code: "",
    address: "",
    city: "",
    state: "",
    pincode: "10001",
    capacity: 10000,
  });

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      location: "",
      code: "",
      address: "",
      city: "",
      state: "",
      pincode: "10001",
      capacity: 10000,
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (wh: Warehouse) => {
    setEditingWarehouse(wh);
    setFormData({
      name: wh.name,
      location: wh.location,
      code: wh.code || "",
      address: wh.address || "",
      city: wh.city || "",
      state: wh.state || "",
      pincode: wh.pincode || "10001",
      capacity: wh.capacity || 10000,
    });
  };

  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location) {
      toast.error("Name and location are required.");
      return;
    }

    try {
      if (editingWarehouse) {
        await updateWarehouseMutation.mutateAsync({ id: editingWarehouse.id, data: formData });
        toast.success("Warehouse updated successfully.");
        setEditingWarehouse(null);
      } else {
        await createWarehouseMutation.mutateAsync(formData);
        toast.success("Warehouse created successfully.");
        setIsAddOpen(false);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to save warehouse.");
    }
  };

  const handleToggleActive = async (wh: Warehouse) => {
    try {
      await updateWarehouseMutation.mutateAsync({
        id: wh.id,
        data: { is_active: !(wh.is_active ?? true) }
      });
      toast.success(`Warehouse ${wh.is_active ? 'deactivated' : 'activated'}.`);
    } catch (err: any) {
      toast.error("Failed to update status.");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-[13px] text-foreground-muted">Loading warehouses...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <WarehouseIcon className="w-6 h-6 text-primary" />
            Warehouses & Stock Management
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Manage physical fulfillment locations and product-based stock allocations.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-md text-[13px] font-medium hover:bg-primary/90 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Warehouse
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-muted/60 text-foreground-muted border-b border-border uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="px-5 py-3.5">Code</th>
                <th className="px-5 py-3.5">Warehouse Name</th>
                <th className="px-5 py-3.5">Location & Address</th>
                <th className="px-5 py-3.5 text-right">Capacity</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {warehouses?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-foreground-muted">
                    No warehouses found. Click <strong>Add Warehouse</strong> to create one.
                  </td>
                </tr>
              ) : (
                warehouses?.map(w => {
                  const isActive = w.is_active ?? true;
                  return (
                    <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-medium text-foreground flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary shrink-0" />
                        {w.code || `WH-${w.id.slice(0,6).toUpperCase()}`}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-foreground">{w.name}</td>
                      <td className="px-5 py-3.5 text-foreground-muted">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                          <span>{w.location}</span>
                        </div>
                        {w.address && <p className="text-[11px] text-foreground-muted mt-0.5">{w.address}, {w.city}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium">{w.capacity ? w.capacity.toLocaleString() : '10,000'} units</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={cn(
                          "inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border uppercase",
                          isActive ? "bg-success/10 text-success border-success/20" : "bg-muted text-foreground-muted border-border"
                        )}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setStockWarehouse(w)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-primary/10 text-primary text-[12px] font-medium hover:bg-primary/20 transition-colors"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            Stock
                          </button>
                          <button
                            onClick={() => handleOpenEdit(w)}
                            className="p-1 rounded hover:bg-muted text-foreground-muted hover:text-foreground transition-colors"
                            title="Edit Warehouse"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(w)}
                            className={cn(
                              "p-1 rounded transition-colors",
                              isActive ? "text-danger hover:bg-danger/10" : "text-success hover:bg-success/10"
                            )}
                            title={isActive ? "Deactivate" : "Activate"}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Warehouse Dialog */}
      {(isAddOpen || editingWarehouse) && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">
                {editingWarehouse ? "Edit Warehouse" : "Add New Warehouse"}
              </h3>
              <button
                onClick={() => { setIsAddOpen(false); setEditingWarehouse(null); }}
                className="text-foreground-muted hover:text-foreground p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveWarehouse} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-foreground mb-1">Warehouse Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. West Coast Distribution"
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-foreground mb-1">Warehouse Code</label>
                  <input
                    type="text"
                    value={formData.code || ""}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. WH-WEST-01"
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-foreground mb-1">Location / Region *</label>
                <input
                  type="text"
                  required
                  value={formData.location || ""}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Mumbai, Maharashtra"
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-foreground mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address || ""}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street address"
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-foreground mb-1">Pincode / Postal</label>
                  <input
                    type="text"
                    value={formData.pincode || ""}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="400001"
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setEditingWarehouse(null); }}
                  className="px-4 py-2 border border-border rounded-md text-[13px] font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-[13px] font-medium hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Save Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Stock Management Modal */}
      {stockWarehouse && (
        <WarehouseStockModal warehouse={stockWarehouse} onClose={() => setStockWarehouse(null)} />
      )}
    </div>
  );
}

function WarehouseStockModal({ warehouse, onClose }: { warehouse: Warehouse; onClose: () => void }) {
  const { data: stockItems, isLoading } = useWarehouseStock(warehouse.id);
  const updateStockMutation = useUpdateStock();
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [newQty, setNewQty] = useState<number>(0);
  const [reason, setReason] = useState<string>("Manual stock adjustment");

  const handleStartEdit = (item: StockItem) => {
    setEditingItem(item);
    setNewQty(item.quantity_on_hand);
    setReason("Manual inventory count / stock receipt");
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      await updateStockMutation.mutateAsync({
        warehouseId: warehouse.id,
        productId: editingItem.product_id,
        quantity_on_hand: newQty,
        reason: reason
      });
      toast.success(`Stock updated for ${editingItem.product_name}.`);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to update stock.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Inventory Stock — {warehouse.name}
            </h3>
            <p className="text-[12px] text-foreground-muted">
              {warehouse.location} · Product-based stock on hand and allocations
            </p>
          </div>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground p-1 rounded-md">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="text-[13px] text-foreground-muted text-center py-8">Loading stock items...</div>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead className="bg-muted/60 text-foreground-muted border-b border-border uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3 text-right">On Hand</th>
                  <th className="px-4 py-3 text-right">Allocated</th>
                  <th className="px-4 py-3 text-right">Available</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stockItems?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{item.product_name}</td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">{item.quantity_on_hand}</td>
                    <td className="px-4 py-3 text-right text-warning font-medium">{item.quantity_allocated}</td>
                    <td className="px-4 py-3 text-right text-success font-bold">{item.available_quantity}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="px-2.5 py-1 rounded border border-border bg-background hover:bg-muted text-[12px] font-medium transition-colors"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {editingItem && (
            <form onSubmit={handleSaveStock} className="mt-6 p-4 rounded-lg bg-muted/40 border border-border space-y-3">
              <h4 className="text-[13px] font-bold text-foreground">
                Adjust Stock for: <span className="text-primary">{editingItem.product_name}</span>
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-foreground mb-1">New Total Quantity On Hand</label>
                  <input
                    type="number"
                    min={editingItem.quantity_allocated}
                    value={newQty}
                    onChange={(e) => setNewQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-[13px] font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-[11px] text-foreground-muted mt-1">Min {editingItem.quantity_allocated} (currently allocated)</p>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-foreground mb-1">Adjustment Reason / Reference</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. New shipment PO-8821"
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 border border-border rounded text-[12px] font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-[12px] font-medium hover:bg-primary/90 shadow-sm"
                >
                  Update & Log Audit
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
