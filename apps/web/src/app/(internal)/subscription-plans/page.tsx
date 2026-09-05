"use client";

import { useState } from "react";
import { useSubscriptionPlans, useCreateSubscriptionPlan, useUpdateSubscriptionPlan, useDeleteSubscriptionPlan } from "@/features/admin/hooks";
import { SubscriptionPlan } from "@/features/admin/types";
import { CreditCard, Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SubscriptionPlansPage() {
  const { data: plans, isLoading } = useSubscriptionPlans();
  const createPlan = useCreateSubscriptionPlan();
  const updatePlan = useUpdateSubscriptionPlan();
  const deletePlan = useDeleteSubscriptionPlan();

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SubscriptionPlan>>({});
  
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<SubscriptionPlan>>({
    name: "", description: "", interval: "month", price: 100, is_active: true
  });

  if (isLoading) return <div className="p-8 text-foreground-muted">Loading plans...</div>;

  const handleCreate = async () => {
    try {
      await createPlan.mutateAsync(createForm);
      toast.success("Plan created");
      setIsCreating(false);
      setCreateForm({ name: "", description: "", interval: "month", price: 100, is_active: true });
    } catch (e) { toast.error("Failed to create plan"); }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updatePlan.mutateAsync({ id, data: editForm });
      toast.success("Plan updated");
      setIsEditing(null);
    } catch (e) { toast.error("Failed to update plan"); }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col h-full">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" /> Subscription Plans
          </h1>
          <p className="text-sm text-foreground-muted mt-1">Manage recurring revenue tiers and pricing intervals.</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Plan
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-foreground-muted border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">Plan Name</th>
              <th className="px-4 py-3 font-medium">Interval</th>
              <th className="px-4 py-3 font-medium text-right">Price</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
              <th className="px-4 py-3 font-medium w-32"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isCreating && (
              <tr className="bg-primary/5">
                <td className="px-4 py-3"><input autoFocus value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} className="w-full p-1 border rounded" placeholder="Plan Name" /></td>
                <td className="px-4 py-3">
                  <select value={createForm.interval} onChange={e => setCreateForm({...createForm, interval: e.target.value})} className="w-full p-1 border rounded">
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </td>
                <td className="px-4 py-3"><input type="number" value={createForm.price} onChange={e => setCreateForm({...createForm, price: parseFloat(e.target.value)})} className="w-24 p-1 border rounded text-right ml-auto" /></td>
                <td className="px-4 py-3 text-center"><span className="text-success font-bold text-xs uppercase">Active</span></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => setIsCreating(false)} className="text-foreground-muted">Cancel</button>
                  <button onClick={handleCreate} className="text-primary font-bold">Save</button>
                </td>
              </tr>
            )}

            {plans?.map(plan => (
              <tr key={plan.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  {isEditing === plan.id ? <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-1 border rounded" /> : <span className="font-medium text-foreground">{plan.name}</span>}
                </td>
                <td className="px-4 py-3 uppercase text-xs font-bold text-foreground-muted">
                  {isEditing === plan.id ? (
                    <select value={editForm.interval} onChange={e => setEditForm({...editForm, interval: e.target.value})} className="w-full p-1 border rounded text-sm normal-case font-normal">
                      <option value="month">Monthly</option>
                      <option value="year">Yearly</option>
                    </select>
                  ) : plan.interval}
                </td>
                <td className="px-4 py-3 text-right font-mono font-medium">
                  {isEditing === plan.id ? <input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: parseFloat(e.target.value)})} className="w-24 p-1 border rounded text-right ml-auto" /> : `$${plan.price.toLocaleString()}`}
                </td>
                <td className="px-4 py-3 text-center">
                  <button 
                    onClick={() => updatePlan.mutate({ id: plan.id, data: { is_active: !plan.is_active } })}
                    className={cn("px-2 py-0.5 rounded text-[11px] font-bold uppercase", plan.is_active ? "bg-success/10 text-success hover:bg-success/20" : "bg-danger/10 text-danger hover:bg-danger/20")}
                  >
                    {plan.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  {isEditing === plan.id ? (
                    <>
                      <button onClick={() => setIsEditing(null)} className="text-foreground-muted hover:text-foreground">Cancel</button>
                      <button onClick={() => handleUpdate(plan.id)} className="text-primary font-bold">Save</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setIsEditing(plan.id); setEditForm(plan); }} className="text-foreground-muted hover:text-primary transition-colors">
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button onClick={() => { if(confirm("Delete plan?")) deletePlan.mutate(plan.id); }} className="text-foreground-muted hover:text-danger transition-colors">
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
