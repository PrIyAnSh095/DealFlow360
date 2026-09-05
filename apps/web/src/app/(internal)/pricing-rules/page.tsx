"use client";

import { useState } from "react";
import { usePricingRules, useCreatePricingRule, useUpdatePricingRule, useDeletePricingRule } from "@/features/admin/hooks";
import { PricingRule } from "@/features/admin/types";
import { Settings2, Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function PricingRulesPage() {
  const { data: rules, isLoading } = usePricingRules();
  const createRule = useCreatePricingRule();
  const updateRule = useUpdatePricingRule();
  const deleteRule = useDeletePricingRule();

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PricingRule>>({});
  
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<PricingRule>>({
    name: "", target_role: "sales", max_discount_percent: 10, requires_approval_above: 5, is_active: true
  });

  if (isLoading) return <div className="p-8 text-foreground-muted">Loading pricing rules...</div>;

  const handleCreate = async () => {
    try {
      await createRule.mutateAsync(createForm);
      toast.success("Rule created");
      setIsCreating(false);
      setCreateForm({ name: "", target_role: "sales", max_discount_percent: 10, requires_approval_above: 5, is_active: true });
    } catch (e) { toast.error("Failed to create rule"); }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateRule.mutateAsync({ id, data: editForm });
      toast.success("Rule updated");
      setIsEditing(null);
    } catch (e) { toast.error("Failed to update rule"); }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col h-full">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-primary" /> Pricing Rules
          </h1>
          <p className="text-sm text-foreground-muted mt-1">Configure automated discounting and approval thresholds.</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-foreground-muted border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">Rule Name</th>
              <th className="px-4 py-3 font-medium">Target Role</th>
              <th className="px-4 py-3 font-medium text-right">Max Discount</th>
              <th className="px-4 py-3 font-medium text-right">Approval Above</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
              <th className="px-4 py-3 font-medium w-32"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isCreating && (
              <tr className="bg-primary/5">
                <td className="px-4 py-3"><input autoFocus value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} className="w-full p-1 border rounded" placeholder="Rule Name" /></td>
                <td className="px-4 py-3">
                  <select value={createForm.target_role} onChange={e => setCreateForm({...createForm, target_role: e.target.value})} className="w-full p-1 border rounded">
                    <option value="sales">Sales Rep</option>
                    <option value="manager">Sales Manager</option>
                  </select>
                </td>
                <td className="px-4 py-3"><input type="number" value={createForm.max_discount_percent} onChange={e => setCreateForm({...createForm, max_discount_percent: parseFloat(e.target.value)})} className="w-20 p-1 border rounded text-right ml-auto" /></td>
                <td className="px-4 py-3"><input type="number" value={createForm.requires_approval_above} onChange={e => setCreateForm({...createForm, requires_approval_above: parseFloat(e.target.value)})} className="w-20 p-1 border rounded text-right ml-auto" /></td>
                <td className="px-4 py-3 text-center"><span className="text-success font-bold text-xs uppercase">Active</span></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => setIsCreating(false)} className="text-foreground-muted">Cancel</button>
                  <button onClick={handleCreate} className="text-primary font-bold">Save</button>
                </td>
              </tr>
            )}

            {rules?.map(rule => (
              <tr key={rule.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  {isEditing === rule.id ? <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-1 border rounded" /> : <span className="font-medium text-foreground">{rule.name}</span>}
                </td>
                <td className="px-4 py-3 uppercase text-xs font-bold text-foreground-muted">
                  {isEditing === rule.id ? (
                    <select value={editForm.target_role} onChange={e => setEditForm({...editForm, target_role: e.target.value})} className="w-full p-1 border rounded text-sm normal-case font-normal">
                      <option value="sales">Sales Rep</option>
                      <option value="manager">Sales Manager</option>
                    </select>
                  ) : rule.target_role}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {isEditing === rule.id ? <input type="number" value={editForm.max_discount_percent} onChange={e => setEditForm({...editForm, max_discount_percent: parseFloat(e.target.value)})} className="w-20 p-1 border rounded text-right ml-auto" /> : `${rule.max_discount_percent}%`}
                </td>
                <td className="px-4 py-3 text-right font-mono font-medium">
                  {isEditing === rule.id ? <input type="number" value={editForm.requires_approval_above} onChange={e => setEditForm({...editForm, requires_approval_above: parseFloat(e.target.value)})} className="w-20 p-1 border rounded text-right ml-auto" /> : `${rule.requires_approval_above}%`}
                </td>
                <td className="px-4 py-3 text-center">
                  <button 
                    onClick={() => updateRule.mutate({ id: rule.id, data: { is_active: !rule.is_active } })}
                    className={cn("px-2 py-0.5 rounded text-[11px] font-bold uppercase", rule.is_active ? "bg-success/10 text-success hover:bg-success/20" : "bg-danger/10 text-danger hover:bg-danger/20")}
                  >
                    {rule.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  {isEditing === rule.id ? (
                    <>
                      <button onClick={() => setIsEditing(null)} className="text-foreground-muted hover:text-foreground">Cancel</button>
                      <button onClick={() => handleUpdate(rule.id)} className="text-primary font-bold">Save</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setIsEditing(rule.id); setEditForm(rule); }} className="text-foreground-muted hover:text-primary transition-colors">
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button onClick={() => { if(confirm("Delete rule?")) deleteRule.mutate(rule.id); }} className="text-foreground-muted hover:text-danger transition-colors">
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
