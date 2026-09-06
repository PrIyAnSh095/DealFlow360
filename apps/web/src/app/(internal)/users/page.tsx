"use client";

import { useAuth } from "@/features/auth/auth-context";
import { useEffect, useState } from "react";
import { ShieldAlert, Plus, Edit2, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { format } from "date-fns";

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "", email: "", password: "", role: "sales", is_active: true
  });
  const ROLES = ['sales', 'manager', 'finance', 'admin', 'sales_rep', 'sales_manager'];

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get(`/admin/users`);
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers();
    }
  }, [user]);

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <ShieldAlert className="w-12 h-12 text-danger" />
        <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
        <p className="text-[13px] text-foreground-muted">You do not have permission to manage users.</p>
      </div>
    );
  }

  const handleDeactivate = async (userId: string) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;
    try {
      await apiClient.delete(`/admin/users/${userId}`);
      fetchUsers();
    } catch (err) {
      console.error("Failed to deactivate user", err);
      alert("Failed to deactivate user.");
    }
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      alert("Name, email, and password are required.");
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.post(`/admin/users`, createForm);
      setCreateForm({ name: "", email: "", password: "", role: "sales", is_active: true });
      setIsCreating(false);
      fetchUsers();
    } catch (err: any) {
      console.error("Failed to create user", err);
      alert(err.response?.data?.detail || "Failed to create user.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">User Management</h1>
          <p className="text-[13px] text-foreground-muted mt-1">Manage platform roles and access.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center justify-center rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-[13px] font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create User
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-[12px] font-semibold text-foreground-muted uppercase tracking-wider">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px] divide-y divide-border">
              {isCreating && (
                <tr className="bg-primary/5">
                  <td className="px-5 py-3">
                    <input autoFocus value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} className="w-full p-1 border rounded text-[13px]" placeholder="Name" />
                  </td>
                  <td className="px-5 py-3">
                    <input type="email" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} className="w-full p-1 border rounded text-[13px]" placeholder="Email" />
                  </td>
                  <td className="px-5 py-3">
                    <select value={createForm.role} onChange={e => setCreateForm({...createForm, role: e.target.value})} className="w-full p-1 border rounded text-[13px] bg-transparent">
                      {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <input type="password" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} className="w-full p-1 border rounded text-[13px]" placeholder="Password" />
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-success font-bold text-xs uppercase">Active</span>
                  </td>
                  <td className="px-5 py-3 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => setIsCreating(false)} className="text-foreground-muted hover:text-foreground" disabled={isSaving}>Cancel</button>
                    <button onClick={handleCreate} className="text-primary font-bold disabled:opacity-50" disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </td>
                </tr>
              )}
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-foreground-muted">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-foreground-muted">No users found.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground whitespace-nowrap">
                      {u.name}
                    </td>
                    <td className="px-5 py-3 text-foreground-muted">
                      {u.email}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium border bg-primary/10 text-primary border-primary/20 uppercase tracking-wider">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {u.is_active ? (
                        <span className="text-success font-medium">Active</span>
                      ) : (
                        <span className="text-danger font-medium">Inactive</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-foreground-muted">
                      {format(new Date(u.created_at), "MMM d, yyyy")}
                    </td>
                    <td className="px-5 py-3 text-right flex justify-end gap-2">
                      <button className="text-foreground-muted hover:text-primary transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeactivate(u.id)} className="text-foreground-muted hover:text-danger transition-colors" title="Deactivate">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
