"use client";

import { useState } from "react";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/features/admin/hooks";
import { Category } from "@/features/admin/types";
import { Tag, Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Category>>({});
  
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<Category>>({
    name: "", description: "", is_active: true
  });

  if (isLoading) return <div className="p-8 text-foreground-muted">Loading categories...</div>;

  const handleCreate = async () => {
    try {
      await createCategory.mutateAsync(createForm);
      toast.success("Category created");
      setIsCreating(false);
      setCreateForm({ name: "", description: "", is_active: true });
    } catch (e) { toast.error("Failed to create category"); }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateCategory.mutateAsync({ id, data: editForm });
      toast.success("Category updated");
      setIsEditing(null);
    } catch (e) { toast.error("Failed to update category"); }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col h-full">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Tag className="w-6 h-6 text-primary" /> Product Categories
          </h1>
          <p className="text-sm text-foreground-muted mt-1">Manage hierarchical product classifications.</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-foreground-muted border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
              <th className="px-4 py-3 font-medium w-32"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isCreating && (
              <tr className="bg-primary/5">
                <td className="px-4 py-3"><input autoFocus value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} className="w-full p-1 border rounded" placeholder="Category Name" /></td>
                <td className="px-4 py-3"><input value={createForm.description || ''} onChange={e => setCreateForm({...createForm, description: e.target.value})} className="w-full p-1 border rounded" placeholder="Description" /></td>
                <td className="px-4 py-3 text-center"><span className="text-success font-bold text-xs uppercase">Active</span></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => setIsCreating(false)} className="text-foreground-muted">Cancel</button>
                  <button onClick={handleCreate} className="text-primary font-bold">Save</button>
                </td>
              </tr>
            )}

            {categories?.map(cat => (
              <tr key={cat.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  {isEditing === cat.id ? <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-1 border rounded" /> : <span className="font-medium text-foreground">{cat.name}</span>}
                </td>
                <td className="px-4 py-3">
                  {isEditing === cat.id ? <input value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full p-1 border rounded" /> : <span className="text-foreground-muted">{cat.description}</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <button 
                    onClick={() => updateCategory.mutate({ id: cat.id, data: { is_active: !cat.is_active } })}
                    className={cn("px-2 py-0.5 rounded text-[11px] font-bold uppercase", cat.is_active ? "bg-success/10 text-success hover:bg-success/20" : "bg-danger/10 text-danger hover:bg-danger/20")}
                  >
                    {cat.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  {isEditing === cat.id ? (
                    <>
                      <button onClick={() => setIsEditing(null)} className="text-foreground-muted hover:text-foreground">Cancel</button>
                      <button onClick={() => handleUpdate(cat.id)} className="text-primary font-bold">Save</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setIsEditing(cat.id); setEditForm(cat); }} className="text-foreground-muted hover:text-primary transition-colors">
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button onClick={() => { if(confirm("Delete category?")) deleteCategory.mutate(cat.id); }} className="text-foreground-muted hover:text-danger transition-colors">
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {categories?.length === 0 && !isCreating && (
              <tr><td colSpan={4} className="p-8 text-center text-foreground-muted">No categories found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
