"use client";

import { useState } from "react";
import { useSettings, useCreateSetting, useUpdateSetting } from "@/features/admin/hooks";
import { GlobalSetting } from "@/features/admin/types";
import { Settings, Plus, Edit2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const createSetting = useCreateSetting();
  const updateSetting = useUpdateSetting();

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<GlobalSetting>>({});
  
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<GlobalSetting>>({
    key: "", value: "", description: ""
  });

  if (isLoading) return <div className="p-8 text-foreground-muted">Loading settings...</div>;

  const handleCreate = async () => {
    if (!createForm.key) return;
    try {
      await createSetting.mutateAsync(createForm);
      toast.success("Setting created");
      setIsCreating(false);
      setCreateForm({ key: "", value: "", description: "" });
    } catch (e) { toast.error("Failed to create setting"); }
  };

  const handleUpdate = async (key: string) => {
    try {
      await updateSetting.mutateAsync({ key, data: editForm });
      toast.success("Setting updated");
      setIsEditing(null);
    } catch (e) { toast.error("Failed to update setting"); }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col h-full">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" /> Global Settings
          </h1>
          <p className="text-sm text-foreground-muted mt-1">System-wide configuration values.</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Setting
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-foreground-muted border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">Key</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium w-32"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isCreating && (
              <tr className="bg-primary/5">
                <td className="px-4 py-3"><input autoFocus value={createForm.key} onChange={e => setCreateForm({...createForm, key: e.target.value})} className="w-full p-1 border rounded font-mono text-[13px]" placeholder="SYSTEM_KEY" /></td>
                <td className="px-4 py-3"><input value={createForm.value} onChange={e => setCreateForm({...createForm, value: e.target.value})} className="w-full p-1 border rounded" placeholder="Value" /></td>
                <td className="px-4 py-3"><input value={createForm.description || ""} onChange={e => setCreateForm({...createForm, description: e.target.value})} className="w-full p-1 border rounded text-xs" placeholder="Description" /></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => setIsCreating(false)} className="text-foreground-muted">Cancel</button>
                  <button onClick={handleCreate} className="text-primary font-bold">Save</button>
                </td>
              </tr>
            )}

            {settings?.map(setting => (
              <tr key={setting.key} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-[13px] text-foreground-muted font-bold">
                  {setting.key}
                </td>
                <td className="px-4 py-3">
                  {isEditing === setting.key ? <input value={editForm.value} onChange={e => setEditForm({...editForm, value: e.target.value})} className="w-full p-1 border rounded" /> : <span className="font-medium text-foreground">{setting.value}</span>}
                </td>
                <td className="px-4 py-3 text-xs text-foreground-muted">
                  {isEditing === setting.key ? <input value={editForm.description || ""} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full p-1 border rounded text-xs" /> : setting.description}
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  {isEditing === setting.key ? (
                    <>
                      <button onClick={() => setIsEditing(null)} className="text-foreground-muted hover:text-foreground">Cancel</button>
                      <button onClick={() => handleUpdate(setting.key)} className="text-primary font-bold">Save</button>
                    </>
                  ) : (
                    <button onClick={() => { setIsEditing(setting.key); setEditForm(setting); }} className="text-foreground-muted hover:text-primary transition-colors">
                      <Edit2 className="w-4 h-4 inline" />
                    </button>
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
