/**
 * useOrgConfig — fetches non-sensitive display configuration from the backend.
 * All values come from the OrganizationProfile table (primary_currency, locale).
 * Defaults to INR / en-IN if the API is unavailable.
 */
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

export interface OrgConfig {
  primary_currency: string;
  locale: string;
}

const DEFAULT_CONFIG: OrgConfig = { primary_currency: "INR", locale: "en-IN" };

export function useOrgConfig(): OrgConfig {
  const [config, setConfig] = useState<OrgConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    apiClient
      .get<OrgConfig>("/admin/organization/public-config")
      .then((res) => setConfig(res.data ?? DEFAULT_CONFIG))
      .catch(() => setConfig(DEFAULT_CONFIG));
  }, []);

  return config;
}

/**
 * Formats a monetary value using the organisation's configured currency and locale.
 * e.g. formatCurrency(150000, { primary_currency: "INR", locale: "en-IN" }) → "₹1,50,000"
 */
export function formatCurrency(value: number, config: OrgConfig): string {
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.primary_currency,
    maximumFractionDigits: 0,
  }).format(value);
}
