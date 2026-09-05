"use client";

import { useState } from "react";
import { useDiscountPolicies, useCreateDiscountPolicy, useUpdateDiscountPolicy, useDeleteDiscountPolicy } from "@/features/admin/hooks";
import { DiscountPolicy } from "@/features/admin/types";
import { Settings2, Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function DiscountPoliciesPage() {
  const { data: policies, isLoading } = useDiscountPolicies();
  const createPolicy = useCreateDiscountPolicy();
  const updatePolicy = useUpdateDiscountPolicy();
  const deletePolicy = useDeleteDiscountPolicy();

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DiscountPolicy>>({});
  
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<DiscountPolicy>>({
    name: "", target_tier: "", target_category: "", max_discount_percent: 0, min_margin_percent: 0, is_active: true
  });

  if (isLoading) return <div className="p-8 text-foreground-muted">Loading discount policies...</div>;

  const handleCreate = async () => {
    try {
      await createPolicy.mutateAsync({
        ...createForm,
        target_tier: createForm.target_tier || null,
        target_category: createForm.target_category || null,
      });
      toast.success("Policy created");
      setIsCreating(false);
      setCreateForm({ name: "", target_tier: "", target_category: "", max_discount_percent: 0, min_margin_percent: 0, is_active: true });
    } catch (e) { toast.error("Failed to create policy"); }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updatePolicy.mutateAsync({ 
        id, 
        data: {
          ...editForm,
          target_tier: editForm.target_tier || null,
          target_category: editForm.target_category || null,
        }
      });
      toast.success("Policy updated");
      setIsEditing(null);
    } catch (e) { toast.error("Failed to update policy"); }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col h-full">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-primary" /> Discount Policies
          </h1>
          <p className="text-sm text-foreground-muted mt-1">Manage global discount rules by tier or category.</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Policy
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-foreground-muted border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Target Tier</th>
              <th className="px-4 py-3 font-medium">Target Category</th>
              <th className="px-4 py-3 font-medium text-right">Max Discount</th>
              <th className="px-4 py-3 font-medium text-right">Min Margin</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
              <th className="px-4 py-3 font-medium w-32"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isCreating && (
              <tr className="bg-primary/5">
                <td className="px-4 py-3"><input autoFocus value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} className="w-full p-1 border rounded" placeholder="Policy Name" /></td>
                <td className="px-4 py-3"><input value={createForm.target_tier || ''} onChange={e => setCreateForm({...createForm, target_tier: e.target.value})} className="w-full p-1 border rounded" placeholder="All" /></td>
                <td className="px-4 py-3"><input value={createForm.target_category || ''} onChange={e => setCreateForm({...createForm, target_category: e.target.value})} className="w-full p-1 border rounded" placeholder="All" /></td>
                <td className="px-4 py-3"><input type="number" value={createForm.max_discount_percent} onChange={e => setCreateForm({...createForm, max_discount_percent: parseFloat(e.target.value)})} className="w-20 p-1 border rounded text-right ml-auto" /></td>
                <td className="px-4 py-3"><input type="number" value={createForm.min_margin_percent || ''} onChange={e => setCreateForm({...createForm, min_margin_percent: parseFloat(e.target.value)})} className="w-20 p-1 border rounded text-right ml-auto" /></td>
                <td className="px-4 py-3 text-center"><span className="text-success font-bold text-xs uppercase">Active</span></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => setIsCreating(false)} className="text-foreground-muted">Cancel</button>
                  <button onClick={handleCreate} className="text-primary font-bold">Save</button>
                </td>
              </tr>
            )}

            {policies?.map(policy => (
              <tr key={policy.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  {isEditing === policy.id ? <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-1 border rounded" /> : <span className="font-medium text-foreground">{policy.name}</span>}
                </td>
                <td className="px-4 py-3">
                  {isEditing === policy.id ? <input value={editForm.target_tier || ''} onChange={e => setEditForm({...editForm, target_tier: e.target.value})} className="w-full p-1 border rounded" /> : <span className="text-foreground-muted">{policy.target_tier || 'All'}</span>}
                </td>
                <td className="px-4 py-3">
                  {isEditing === policy.id ? <input value={editForm.target_category || ''} onChange={e => setEditForm({...editForm, target_category: e.target.value})} className="w-full p-1 border rounded" /> : <span className="text-foreground-muted">{policy.target_category || 'All'}</span>}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {isEditing === policy.id ? <input type="number" value={editForm.max_discount_percent} onChange={e => setEditForm({...editForm, max_discount_percent: parseFloat(e.target.value)})} className="w-20 p-1 border rounded text-right ml-auto" /> : `${policy.max_discount_percent}%`}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {isEditing === policy.id ? <input type="number" value={editForm.min_margin_percent || ''} onChange={e => setEditForm({...editForm, min_margin_percent: parseFloat(e.target.value)})} className="w-20 p-1 border rounded text-right ml-auto" /> : (policy.min_margin_percent ? `${policy.min_margin_percent}%` : '-')}
                </td>
                <td className="px-4 py-3 text-center">
                  <button 
                    onClick={() => updatePolicy.mutate({ id: policy.id, data: { is_active: !policy.is_active } })}
                    className={cn("px-2 py-0.5 rounded text-[11px] font-bold uppercase", policy.is_active ? "bg-success/10 text-success hover:bg-success/20" : "bg-danger/10 text-danger hover:bg-danger/20")}
                  >
                    {policy.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  {isEditing === policy.id ? (
                    <>
                      <button onClick={() => setIsEditing(null)} className="text-foreground-muted hover:text-foreground">Cancel</button>
                      <button onClick={() => handleUpdate(policy.id)} className="text-primary font-bold">Save</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setIsEditing(policy.id); setEditForm(policy); }} className="text-foreground-muted hover:text-primary transition-colors">
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button onClick={() => { if(confirm("Delete policy?")) deletePolicy.mutate(policy.id); }} className="text-foreground-muted hover:text-danger transition-colors">
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {policies?.length === 0 && !isCreating && (
              <tr><td colSpan={7} className="p-8 text-center text-foreground-muted">No discount policies found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
