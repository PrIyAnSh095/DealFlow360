"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Sparkles, Save, ShieldCheck, Loader2, Info, CheckSquare, Square } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AIConfigPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/v1/admin/ai-config`);
      setConfig(res.data);
    } catch (err) {
      console.error("Failed to load AI config", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: string) => {
    setConfig((prev: any) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setMessage(null);
      const token = localStorage.getItem("dealflow_token");
      await axios.put(`${API_BASE_URL}/api/v1/admin/ai-config`, config, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setMessage("Company AI Data Sharing Privacy Configuration saved to PostgreSQL successfully!");
    } catch (err: any) {
      setMessage("Failed to save AI configuration. Please check permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-foreground-muted text-sm">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading Company AI Configuration...
      </div>
    );
  }

  const sections = [
    {
      title: "Customer Profile Privacy Toggles",
      items: [
        { key: "share_customer_tier", label: "Share Customer Tier & Rank" },
        { key: "share_loyalty_status", label: "Share Loyalty Status" },
        { key: "share_account_age", label: "Share Account Age" }
      ]
    },
    {
      title: "Customer Commercial History Toggles",
      items: [
        { key: "share_lifetime_revenue", label: "Share Lifetime Revenue (LTV)" },
        { key: "share_purchase_count", label: "Share Total Purchase Count" },
        { key: "share_purchase_frequency", label: "Share Purchase Frequency" },
        { key: "share_avg_order_value", label: "Share Average Order Value" },
        { key: "share_historical_discounts", label: "Share Historical Average Discount %" }
      ]
    },
    {
      title: "Subscriptions & Recurring Billing Toggles",
      items: [
        { key: "share_active_subscriptions", label: "Share Active Subscription Status" },
        { key: "share_subscription_type", label: "Share Subscription Plan & Type" },
        { key: "share_subscription_value", label: "Share Subscription Value" },
        { key: "share_renewal_info", label: "Share Renewal & Expiration Info" }
      ]
    },
    {
      title: "Quotation & Pricing Data Toggles",
      items: [
        { key: "share_product_info", label: "Share Product Names & SKUs" },
        { key: "share_pricing", label: "Share Unit Pricing & Line Totals" },
        { key: "share_discounts", label: "Share Discount Percentages" },
        { key: "share_margins", label: "Share Gross Margins & Margin %" },
        { key: "share_approval_status", label: "Share Approval Status & Triggers" }
      ]
    },
    {
      title: "Fulfillment & Logistics Data Toggles",
      items: [
        { key: "share_warehouse_availability", label: "Share Warehouse Locations" },
        { key: "share_stock_quantities", label: "Share Stock Quantities" },
        { key: "share_allocation_plans", label: "Share Multi-Warehouse Allocation Plans" },
        { key: "share_backorders", label: "Share Backorder Status" },
        { key: "share_shipping_cost", label: "Share Shipping Costs & Rates" },
        { key: "share_eta", label: "Share Estimated Delivery ETAs" }
      ]
    },
    {
      title: "AI Purpose & Application Permissions",
      items: [
        { key: "purpose_quotation_explanation", label: "Allow Quotation AI Explanation (ⓘ Button)" },
        { key: "purpose_sales_recommendation", label: "Allow Sales Upsell/Cross-sell AI Insights" },
        { key: "purpose_finance_analysis", label: "Allow Finance Margin & Discount AI Analysis" },
        { key: "purpose_fulfillment_recommendation", label: "Allow Warehouse Split AI Recommendations" }
      ]
    }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Company AI Configuration & Consent Policy
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Control which categories of company & customer business data are provided to the local Ollama AI model.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Policy
        </button>
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-3 text-sm text-foreground">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-primary">Local Ollama AI Security Guarantee</p>
          <p className="text-foreground-muted text-xs mt-0.5">
            DealFlow360 processes AI context strictly on local Ollama models. Disabling a category below guarantees that category will be omitted from Ollama context payloads server-side. Passwords, JWT tokens, and API secrets are never transmitted.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          {message}
        </div>
      )}

      {/* Settings Grid */}
      <div className="space-y-6">
        {sections.map((sec, idx) => (
          <div key={idx} className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">
              {sec.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {sec.items.map((item) => {
                const checked = Boolean(config[item.key]);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleToggle(item.key)}
                    className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                      checked
                        ? "bg-muted/40 border-primary/40 text-foreground"
                        : "bg-background border-border text-foreground-muted hover:text-foreground"
                    }`}
                  >
                    <span className="text-xs font-medium">{item.label}</span>
                    <div className="shrink-0 ml-2">
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-foreground-muted/40" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Save Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Configuration
        </button>
      </div>

    </div>
  );
}
