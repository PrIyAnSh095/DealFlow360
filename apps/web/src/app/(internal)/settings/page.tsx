"use client";

import { useAuth } from "@/features/auth/auth-context";
import { User, Settings, Bell, Shield, Moon, Sun, Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    
    setIsSaving(true);
    try {
      await updateUser({ name });
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-[13px] text-foreground-muted mt-1">
          Manage your profile and application preferences.
        </p>
      </div>

      <div className="flex-1 min-h-0 bg-surface border border-border rounded-lg shadow-sm p-6 overflow-y-auto">
        <div className="max-w-2xl space-y-8">
          
          <section>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary" />
              Profile Information
            </h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-foreground-muted mb-1">Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-foreground-muted mb-1">Email</label>
                  <input type="email" className="w-full bg-muted border border-border rounded-md px-3 py-2 text-[13px] text-foreground-muted cursor-not-allowed focus:outline-none" value={user?.email || ''} disabled />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-foreground-muted mb-1">Role</label>
                <input type="text" className="w-full bg-muted border border-border rounded-md px-3 py-2 text-[13px] text-foreground-muted uppercase cursor-not-allowed focus:outline-none" value={user?.role || ''} disabled />
              </div>
              <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  disabled={isSaving || name === user?.name}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-[13px] font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Profile
                </button>
              </div>
            </form>
          </section>

          <hr className="border-border" />
          
          <section>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-primary" />
              Preferences
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-border rounded-md bg-background">
                <div>
                  <h3 className="font-medium text-[13px]">Theme</h3>
                  <p className="text-[12px] text-foreground-muted">Choose your preferred appearance.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setTheme("light")}
                    className={`p-2 border rounded-md transition-colors ${theme === "light" ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted text-foreground-muted hover:text-foreground"}`}
                  >
                    <Sun className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setTheme("dark")}
                    className={`p-2 border rounded-md transition-colors ${theme === "dark" ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted text-foreground-muted hover:text-foreground"}`}
                  >
                    <Moon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-border" />
          
          <section>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              Notifications
            </h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-border text-primary cursor-pointer" defaultChecked onChange={() => toast.success("Notification preferences updated")} />
                <span className="text-[13px] font-medium group-hover:text-primary transition-colors">Email notifications for deal approvals</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-border text-primary cursor-pointer" defaultChecked onChange={() => toast.success("Notification preferences updated")} />
                <span className="text-[13px] font-medium group-hover:text-primary transition-colors">Alerts for high-risk deals</span>
              </label>
            </div>
          </section>
          
        </div>
      </div>
    </div>
  );
}
