"use client";

import { useState } from "react";
import { useCustomerTiers, useCreateCustomerTier, useUpdateCustomerTier, useDeleteCustomerTier } from "@/features/admin/hooks";
import { CustomerTier } from "@/features/admin/types";
import { Award, Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CustomerTiersPage() {
  const { data: tiers, isLoading } = useCustomerTiers();
  const createTier = useCreateCustomerTier();
  const updateTier = useUpdateCustomerTier();
  const deleteTier = useDeleteCustomerTier();

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CustomerTier>>({});
  
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<CustomerTier>>({
    name: "", baseline_discount: 0, is_active: true
  });

  if (isLoading) return <div className="p-8 text-foreground-muted">Loading tiers...</div>;

  const handleCreate = async () => {
    try {
      await createTier.mutateAsync(createForm);
      toast.success("Tier created");
      setIsCreating(false);
      setCreateForm({ name: "", baseline_discount: 0, is_active: true });
    } catch (e) { toast.error("Failed to create tier"); }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateTier.mutateAsync({ id, data: editForm });
      toast.success("Tier updated");
      setIsEditing(null);
    } catch (e) { toast.error("Failed to update tier"); }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col h-full">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" /> Customer Tiers
          </h1>
          <p className="text-sm text-foreground-muted mt-1">Manage global customer segmentation and baseline discounts.</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Tier
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-foreground-muted border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium text-right">Baseline Discount</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
              <th className="px-4 py-3 font-medium w-32"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isCreating && (
              <tr className="bg-primary/5">
                <td className="px-4 py-3"><input autoFocus value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} className="w-full p-1 border rounded" placeholder="Tier Name (e.g. Gold)" /></td>
                <td className="px-4 py-3 text-right"><input type="number" value={createForm.baseline_discount} onChange={e => setCreateForm({...createForm, baseline_discount: parseFloat(e.target.value)})} className="w-20 p-1 border rounded text-right" /></td>
                <td className="px-4 py-3 text-center"><span className="text-success font-bold text-xs uppercase">Active</span></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => setIsCreating(false)} className="text-foreground-muted">Cancel</button>
                  <button onClick={handleCreate} className="text-primary font-bold">Save</button>
                </td>
              </tr>
            )}

            {tiers?.map(tier => (
              <tr key={tier.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  {isEditing === tier.id ? <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-1 border rounded" /> : <span className="font-medium text-foreground">{tier.name}</span>}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {isEditing === tier.id ? <input type="number" value={editForm.baseline_discount} onChange={e => setEditForm({...editForm, baseline_discount: parseFloat(e.target.value)})} className="w-20 p-1 border rounded text-right" /> : `${tier.baseline_discount}%`}
                </td>
                <td className="px-4 py-3 text-center">
                  <button 
                    onClick={() => updateTier.mutate({ id: tier.id, data: { is_active: !tier.is_active } })}
                    className={cn("px-2 py-0.5 rounded text-[11px] font-bold uppercase", tier.is_active ? "bg-success/10 text-success hover:bg-success/20" : "bg-danger/10 text-danger hover:bg-danger/20")}
                  >
                    {tier.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  {isEditing === tier.id ? (
                    <>
                      <button onClick={() => setIsEditing(null)} className="text-foreground-muted hover:text-foreground">Cancel</button>
                      <button onClick={() => handleUpdate(tier.id)} className="text-primary font-bold">Save</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setIsEditing(tier.id); setEditForm(tier); }} className="text-foreground-muted hover:text-primary transition-colors">
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button onClick={() => { if(confirm("Delete tier?")) deleteTier.mutate(tier.id); }} className="text-foreground-muted hover:text-danger transition-colors">
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {tiers?.length === 0 && !isCreating && (
              <tr><td colSpan={4} className="p-8 text-center text-foreground-muted">No tiers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
