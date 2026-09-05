"use client";

import { useState } from "react";
import { useAdminProducts, useCreateProduct, useUpdateProduct } from "@/features/admin/hooks";
import { Product } from "@/features/quotations/types";
import { Box, Plus, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProductsPage() {
  const { data: products, isLoading } = useAdminProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<Product>>({
    name: "",
    sku: "",
    category: "hardware",
    sales_price: 0,
    cost: 0,
    is_active: true
  });

  if (isLoading) return <div className="p-8 text-foreground-muted">Loading products...</div>;

  const handleCreate = async () => {
    try {
      await createProduct.mutateAsync(createForm);
      toast.success("Product created successfully");
      setIsCreating(false);
      setCreateForm({ name: "", sku: "", category: "hardware", sales_price: 0, cost: 0, is_active: true });
    } catch (error: unknown) {
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail || "Failed to create product");
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateProduct.mutateAsync({ id, data: editForm });
      toast.success("Product updated");
      setIsEditing(null);
    } catch {
      toast.error("Failed to update product");
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateProduct.mutateAsync({ id, data: { is_active: !currentStatus } });
      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col h-full">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Box className="w-6 h-6 text-primary" />
            Product Catalog
          </h1>
          <p className="text-sm text-foreground-muted mt-1">Manage master product catalog and cost bases.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm flex-1 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-foreground-muted border-b border-border sticky top-0">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium text-right">Internal Cost</th>
              <th className="px-4 py-3 font-medium text-right">Customer Price</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
              <th className="px-4 py-3 font-medium w-32"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isCreating && (
              <tr className="bg-primary/5">
                <td className="px-4 py-3">
                  <input autoFocus value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} className="w-full p-1 border rounded" placeholder="Name" />
                </td>
                <td className="px-4 py-3">
                  <input value={createForm.sku} onChange={e => setCreateForm({...createForm, sku: e.target.value})} className="w-full p-1 border rounded" placeholder="SKU" />
                </td>
                <td className="px-4 py-3">
                  <select value={createForm.category} onChange={e => setCreateForm({...createForm, category: e.target.value})} className="w-full p-1 border rounded">
                    <option value="hardware">Hardware</option>
                    <option value="software">Software</option>
                    <option value="service">Service</option>
                    <option value="subscription">Subscription</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input type="number" value={createForm.cost} onChange={e => setCreateForm({...createForm, cost: parseFloat(e.target.value)})} className="w-24 p-1 border rounded text-right ml-auto" />
                </td>
                <td className="px-4 py-3">
                  <input type="number" value={createForm.sales_price} onChange={e => setCreateForm({...createForm, sales_price: parseFloat(e.target.value)})} className="w-24 p-1 border rounded text-right ml-auto" />
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-success font-bold text-xs uppercase">Active</span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => setIsCreating(false)} className="text-foreground-muted hover:text-foreground">Cancel</button>
                  <button onClick={handleCreate} className="text-primary font-bold">Save</button>
                </td>
              </tr>
            )}

            {products?.map(product => (
              <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  {isEditing === product.id ? (
                    <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-1 border rounded" />
                  ) : (
                    <span className="font-medium text-foreground">{product.name}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-foreground-muted">
                  {isEditing === product.id ? (
                    <input value={editForm.sku} onChange={e => setEditForm({...editForm, sku: e.target.value})} className="w-full p-1 border rounded" />
                  ) : product.sku}
                </td>
                <td className="px-4 py-3 uppercase text-xs font-bold text-foreground-muted">
                  {isEditing === product.id ? (
                    <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className="w-full p-1 border rounded text-sm normal-case font-normal">
                      <option value="hardware">Hardware</option>
                      <option value="software">Software</option>
                      <option value="service">Service</option>
                      <option value="subscription">Subscription</option>
                    </select>
                  ) : product.category}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {isEditing === product.id ? (
                    <input type="number" value={editForm.cost} onChange={e => setEditForm({...editForm, cost: parseFloat(e.target.value)})} className="w-24 p-1 border rounded text-right ml-auto" />
                  ) : `$${product.cost.toLocaleString()}`}
                </td>
                <td className="px-4 py-3 text-right font-mono font-medium">
                  {isEditing === product.id ? (
                    <input type="number" value={editForm.sales_price} onChange={e => setEditForm({...editForm, sales_price: parseFloat(e.target.value)})} className="w-24 p-1 border rounded text-right ml-auto" />
                  ) : `$${product.sales_price.toLocaleString()}`}
                </td>
                <td className="px-4 py-3 text-center">
                  <button 
                    onClick={() => toggleStatus(product.id, product.is_active)}
                    className={cn("px-2 py-0.5 rounded text-[11px] font-bold uppercase transition-colors", product.is_active ? "bg-success/10 text-success hover:bg-success/20" : "bg-danger/10 text-danger hover:bg-danger/20")}
                  >
                    {product.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  {isEditing === product.id ? (
                    <>
                      <button onClick={() => setIsEditing(null)} className="text-foreground-muted hover:text-foreground">Cancel</button>
                      <button onClick={() => handleUpdate(product.id)} className="text-primary font-bold">Save</button>
                    </>
                  ) : (
                    <button 
                      onClick={() => { setIsEditing(product.id); setEditForm(product); }}
                      className="text-foreground-muted hover:text-primary transition-colors"
                    >
                      <Edit2 className="w-4 h-4 inline" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {products?.length === 0 && !isCreating && (
              <tr><td colSpan={7} className="p-8 text-center text-foreground-muted">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
