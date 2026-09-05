"use client";

import { useState, useEffect } from "react";
import { useSettings, useUpdateSetting, useCreateSetting } from "@/features/admin/hooks";
import { Settings, Save, Bell, Shield, Building, Loader2 } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_SETTINGS = [
  { key: "COMPANY_NAME", value: "Acme Corp", description: "Company name displayed on quotes" },
  { key: "DEFAULT_CURRENCY", value: "USD", description: "Default currency for new deals" },
  { key: "NOTIFY_ON_DEAL_WON", value: "true", description: "Send email notifications when a deal is marked as Won" },
  { key: "REQUIRE_2FA", value: "false", description: "Require two-factor authentication for all users" },
  { key: "MAX_SESSION_HOURS", value: "24", description: "Maximum session duration in hours" },
];

export default function SettingsPage() {
  const { data: settings, isLoading, refetch } = useSettings();
  const updateSetting = useUpdateSetting();
  const createSetting = useCreateSetting();

  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      const data: Record<string, string> = {};
      DEFAULT_SETTINGS.forEach(def => {
        const found = settings.find(s => s.key === def.key);
        data[def.key] = found ? found.value : def.value;
      });
      setFormData(data);
    }
  }, [settings]);

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const def of DEFAULT_SETTINGS) {
        const existing = settings?.find(s => s.key === def.key);
        const newValue = formData[def.key];
        
        if (existing) {
          if (existing.value !== newValue) {
            await updateSetting.mutateAsync({ key: def.key, data: { value: newValue } });
          }
        } else {
          await createSetting.mutateAsync({ key: def.key, value: newValue, description: def.description });
        }
      }
      toast.success("Settings saved successfully");
      refetch();
    } catch (e) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col h-full gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" /> System Settings
        </h1>
        <p className="text-sm text-foreground-muted mt-1">Manage workspace preferences and security policies.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-64 flex flex-col gap-1 shrink-0">
          <button onClick={() => setActiveTab("general")} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "general" ? "bg-primary text-primary-foreground" : "text-foreground-muted hover:bg-muted hover:text-foreground"}`}>
            <Building className="w-4 h-4" /> General
          </button>
          <button onClick={() => setActiveTab("notifications")} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "notifications" ? "bg-primary text-primary-foreground" : "text-foreground-muted hover:bg-muted hover:text-foreground"}`}>
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button onClick={() => setActiveTab("security")} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "security" ? "bg-primary text-primary-foreground" : "text-foreground-muted hover:bg-muted hover:text-foreground"}`}>
            <Shield className="w-4 h-4" /> Security
          </button>
        </div>

        <div className="flex-1 bg-surface border border-border rounded-xl shadow-sm p-6 w-full">
          {activeTab === "general" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">General Settings</h3>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-foreground">Company Name</label>
                  <p className="text-[12px] text-foreground-muted mb-2">This will be displayed on all generated PDF quotations.</p>
                  <input 
                    value={formData["COMPANY_NAME"] || ""} 
                    onChange={e => handleChange("COMPANY_NAME", e.target.value)}
                    className="w-full max-w-md p-2 border border-border bg-background rounded-md text-sm focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-foreground">Default Currency</label>
                  <p className="text-[12px] text-foreground-muted mb-2">The standard currency used for new deals and pipeline calculations.</p>
                  <select 
                    value={formData["DEFAULT_CURRENCY"] || "USD"} 
                    onChange={e => handleChange("DEFAULT_CURRENCY", e.target.value)}
                    className="w-full max-w-md p-2 border border-border bg-background rounded-md text-sm focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Notification Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="space-y-0.5">
                    <label className="text-[13px] font-medium text-foreground">Deal Won Alerts</label>
                    <p className="text-[12px] text-foreground-muted">Send organization-wide emails when high-value deals are won.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={formData["NOTIFY_ON_DEAL_WON"] === "true"} onChange={e => handleChange("NOTIFY_ON_DEAL_WON", e.target.checked ? "true" : "false")} />
                    <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Security & Access</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="space-y-0.5">
                    <label className="text-[13px] font-medium text-foreground">Require Two-Factor Auth (2FA)</label>
                    <p className="text-[12px] text-foreground-muted">Enforce 2FA for all Sales Managers and Admins.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={formData["REQUIRE_2FA"] === "true"} onChange={e => handleChange("REQUIRE_2FA", e.target.checked ? "true" : "false")} />
                    <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="space-y-1.5 pt-2">
                  <label className="text-[13px] font-medium text-foreground">Session Timeout (Hours)</label>
                  <p className="text-[12px] text-foreground-muted mb-2">Automatically log users out after inactivity.</p>
                  <input 
                    type="number"
                    value={formData["MAX_SESSION_HOURS"] || ""} 
                    onChange={e => handleChange("MAX_SESSION_HOURS", e.target.value)}
                    className="w-32 p-2 border border-border bg-background rounded-md text-sm focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-border flex justify-end">
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
