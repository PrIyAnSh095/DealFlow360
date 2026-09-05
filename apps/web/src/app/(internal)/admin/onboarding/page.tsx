"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, Briefcase, Users, DollarSign, Truck, ShieldCheck, 
  ChevronRight, ChevronLeft, Check, Sparkles, Sliders 
} from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/features/admin/api";

export default function OrganizationOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Company Profile
    company_name: "DealFlow360 Enterprises",
    legal_name: "DealFlow360 Technologies Private Limited",
    industry: "Software & Enterprise IT Services",
    business_type: "B2B Enterprise SaaS & Hardware",
    headquarters: "San Francisco, CA",
    operating_regions: "North America, Europe, Asia Pacific",
    countries_served: "United States, Canada, United Kingdom, India",
    primary_currency: "INR",
    timezone: "Asia/Kolkata",
    business_description: "Leading provider of enterprise B2B deal execution, quotation intelligence, and automated fulfillment solutions.",

    // Step 2: Business Model
    primary_sales_model: "Hybrid (One-time Hardware & Recurring SaaS)",
    typical_deal_size: "₹100,000 - ₹5,000,000",

    // Step 3: Customer Strategy
    customer_loyalty_definition: "Account age >= 2 years and total lifetime spend exceeding ₹1,500,000.",

    // Step 4: Commercial Context
    pricing_strategy: "Value-based tiered pricing with strict target margin enforcement.",
    discount_philosophy: "Sales reps permitted up to 10%. 10-25% requires Sales Manager approval. >25% requires Finance VP override.",
    margin_priority: "Maintain minimum 15.0% gross margin on hardware and 70.0% on software subscriptions.",

    // Step 5: Operations Context
    fulfillment_priority: "Optimize for lowest shipping cost while meeting delivery commitments within 5 business days.",

    // Step 6: AI Data Policy Toggles
    provider: "ollama",
    model_name: "llama3",
    enabled: true,
    share_customer_tier: true,
    share_loyalty_status: true,
    share_account_age: true,
    share_lifetime_revenue: true,
    share_purchase_count: true,
    share_purchase_frequency: true,
    share_avg_order_value: true,
    share_historical_discounts: true,
    share_active_subscriptions: true,
    share_subscription_type: true,
    share_subscription_value: true,
    share_renewal_info: true,
    share_product_info: true,
    share_pricing: true,
    share_discounts: true,
    share_margins: true,
    share_approval_status: true,
    share_deal_health: true,
    share_deal_stage: true,
    share_negotiation_history: true,
    share_delivery_risk: true,
    share_warehouse_availability: true,
    share_stock_quantities: true,
    share_allocation_plans: true,
    share_backorders: true,
    share_shipping_cost: true,
    share_courier_info: true,
    share_eta: true,
    share_logistics_info: true,
  });

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (step < 6) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Save Organization Profile
      await fetch("/api/v1/admin/organization/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // 2. Save AI Config Data Policy Toggles
      await adminApi.updateAiConfig({
        provider: formData.provider,
        model_name: formData.model_name,
        enabled: formData.enabled,
        share_customer_tier: formData.share_customer_tier,
        share_loyalty_status: formData.share_loyalty_status,
        share_account_age: formData.share_account_age,
        share_lifetime_revenue: formData.share_lifetime_revenue,
        share_purchase_count: formData.share_purchase_count,
        share_purchase_frequency: formData.share_purchase_frequency,
        share_avg_order_value: formData.share_avg_order_value,
        share_historical_discounts: formData.share_historical_discounts,
        share_active_subscriptions: formData.share_active_subscriptions,
        share_subscription_type: formData.share_subscription_type,
        share_subscription_value: formData.share_subscription_value,
        share_renewal_info: formData.share_renewal_info,
        share_product_info: formData.share_product_info,
        share_pricing: formData.share_pricing,
        share_discounts: formData.share_discounts,
        share_margins: formData.share_margins,
        share_approval_status: formData.share_approval_status,
        share_deal_health: formData.share_deal_health,
        share_deal_stage: formData.share_deal_stage,
        share_negotiation_history: formData.share_negotiation_history,
        share_delivery_risk: formData.share_delivery_risk,
        share_warehouse_availability: formData.share_warehouse_availability,
        share_stock_quantities: formData.share_stock_quantities,
        share_allocation_plans: formData.share_allocation_plans,
        share_backorders: formData.share_backorders,
        share_shipping_cost: formData.share_shipping_cost,
        share_courier_info: formData.share_courier_info,
        share_eta: formData.share_eta,
        share_logistics_info: formData.share_logistics_info,
      });

      toast.success("Organization onboarding and AI privacy policy configured successfully!");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete organization onboarding.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 mb-3">
          <Sparkles className="w-4 h-4" /> Organization Admin Setup
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Organization Onboarding & AI Data Governance
        </h1>
        <p className="text-sm text-foreground-muted mt-2 max-w-2xl mx-auto">
          Configure company profile, commercial parameters, and control which PostgreSQL data categories the local Ollama AI engine is authorized to process.
        </p>
      </div>

      {/* Progress Steps Header */}
      <div className="flex items-center justify-between mb-8 bg-surface border border-border rounded-xl p-4 shadow-sm">
        {[
          { num: 1, label: "Company", icon: Building2 },
          { num: 2, label: "Business Model", icon: Briefcase },
          { num: 3, label: "Customer Strategy", icon: Users },
          { num: 4, label: "Commercial", icon: DollarSign },
          { num: 5, label: "Operations", icon: Truck },
          { num: 6, label: "AI Governance", icon: ShieldCheck },
        ].map((s) => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isDone = step > s.num;

          return (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                  isDone
                    ? "bg-success text-success-foreground"
                    : isActive
                    ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30"
                    : "bg-muted text-foreground-muted"
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-xs font-medium hidden md:inline ${isActive ? "text-foreground font-bold" : "text-foreground-muted"}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Form Step Body */}
      <div className="bg-surface border border-border rounded-xl p-8 shadow-sm">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Building2 className="w-5 h-5 text-primary" /> Step 1 — Company Profile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleChange("company_name", e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Legal Business Name</label>
                <input
                  type="text"
                  value={formData.legal_name}
                  onChange={(e) => handleChange("legal_name", e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Industry</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => handleChange("industry", e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Business Type</label>
                <input
                  type="text"
                  value={formData.business_type}
                  onChange={(e) => handleChange("business_type", e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Headquarters</label>
                <input
                  type="text"
                  value={formData.headquarters}
                  onChange={(e) => handleChange("headquarters", e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Primary Currency</label>
                <input
                  type="text"
                  value={formData.primary_currency}
                  onChange={(e) => handleChange("primary_currency", e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Business Overview</label>
              <textarea
                rows={3}
                value={formData.business_description}
                onChange={(e) => handleChange("business_description", e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Briefcase className="w-5 h-5 text-primary" /> Step 2 — Business Model & Sales Structure
            </h2>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Primary Sales Model</label>
              <input
                type="text"
                value={formData.primary_sales_model}
                onChange={(e) => handleChange("primary_sales_model", e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Typical Deal Size Range</label>
              <input
                type="text"
                value={formData.typical_deal_size}
                onChange={(e) => handleChange("typical_deal_size", e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Users className="w-5 h-5 text-primary" /> Step 3 — Customer Strategy & Loyalty Philosophy
            </h2>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Customer Loyalty Definition</label>
              <textarea
                rows={3}
                value={formData.customer_loyalty_definition}
                onChange={(e) => handleChange("customer_loyalty_definition", e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <DollarSign className="w-5 h-5 text-primary" /> Step 4 — Commercial & Pricing Policy Context
            </h2>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Pricing Strategy</label>
              <input
                type="text"
                value={formData.pricing_strategy}
                onChange={(e) => handleChange("pricing_strategy", e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Discount Philosophy & Governance</label>
              <input
                type="text"
                value={formData.discount_philosophy}
                onChange={(e) => handleChange("discount_philosophy", e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Target Margin Priority</label>
              <input
                type="text"
                value={formData.margin_priority}
                onChange={(e) => handleChange("margin_priority", e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Truck className="w-5 h-5 text-primary" /> Step 5 — Fulfillment & Operations Strategy
            </h2>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Fulfillment Priority & Split Policy</label>
              <textarea
                rows={3}
                value={formData.fulfillment_priority}
                onChange={(e) => handleChange("fulfillment_priority", e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <ShieldCheck className="w-5 h-5 text-primary" /> Step 6 — AI Data Privacy & Category Governance Toggles
            </h2>

            <p className="text-xs text-foreground-muted">
              Select which PostgreSQL database categories the local Ollama AI model is authorized to receive during quotation and warehouse decision support.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Toggles */}
              <div className="p-4 rounded-lg border border-border bg-card space-y-2">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Customer Data Category</h4>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={formData.share_customer_tier} onChange={(e) => handleChange("share_customer_tier", e.target.checked)} className="rounded" />
                  Share Customer Tier
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={formData.share_lifetime_revenue} onChange={(e) => handleChange("share_lifetime_revenue", e.target.checked)} className="rounded" />
                  Share Lifetime Revenue
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={formData.share_purchase_frequency} onChange={(e) => handleChange("share_purchase_frequency", e.target.checked)} className="rounded" />
                  Share Purchase Frequency
                </label>
              </div>

              {/* Subscription Toggles */}
              <div className="p-4 rounded-lg border border-border bg-card space-y-2">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Subscription Data Category</h4>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={formData.share_active_subscriptions} onChange={(e) => handleChange("share_active_subscriptions", e.target.checked)} className="rounded" />
                  Share Active Subscriptions
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={formData.share_subscription_value} onChange={(e) => handleChange("share_subscription_value", e.target.checked)} className="rounded" />
                  Share Recurring Value
                </label>
              </div>

              {/* Commercial Toggles */}
              <div className="p-4 rounded-lg border border-border bg-card space-y-2">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Quotation & Pricing Category</h4>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={formData.share_discounts} onChange={(e) => handleChange("share_discounts", e.target.checked)} className="rounded" />
                  Share Quote Discounts
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={formData.share_margins} onChange={(e) => handleChange("share_margins", e.target.checked)} className="rounded" />
                  Share Gross Margins
                </label>
              </div>

              {/* Fulfillment Toggles */}
              <div className="p-4 rounded-lg border border-border bg-card space-y-2">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Fulfillment & Stock Category</h4>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={formData.share_warehouse_availability} onChange={(e) => handleChange("share_warehouse_availability", e.target.checked)} className="rounded" />
                  Share Warehouse Availability
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={formData.share_shipping_cost} onChange={(e) => handleChange("share_shipping_cost", e.target.checked)} className="rounded" />
                  Share Shipping Cost & ETA
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Buttons Footer */}
        <div className="mt-8 pt-4 border-t border-border flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1}
            className="px-4 py-2 text-xs font-bold rounded-md border border-border bg-surface hover:bg-muted transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {step < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 text-xs font-bold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-1.5"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 text-xs font-bold rounded-md bg-success text-success-foreground hover:bg-success/90 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> Save & Complete Onboarding
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
