"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowLeft, Save } from "lucide-react";
import { QuoteLineTable } from "@/features/quotations/components/quote-line-table";
import { useProducts } from "@/features/quotations/hooks";
import { quotationsApi } from "@/features/quotations/api";
import { QuoteLineInput } from "@/features/quotations/types";
import { dealsApi } from "@/features/deals/api";
import { Deal } from "@/features/deals/types";
import { useAuth } from "@/features/auth/auth-context";

export default function NewQuotationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: products, isLoading: isLoadingProducts } = useProducts();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDealId, setSelectedDealId] = useState("");
  const [isLoadingDeals, setIsLoadingDeals] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { control, register, handleSubmit } = useForm<{ lines: QuoteLineInput[] }>({
    defaultValues: {
      lines: [{ product_id: "", quantity: 1, discount_percent: 0 }],
    },
  });

  useEffect(() => {
    dealsApi.getDeals()
      .then(setDeals)
      .catch(() => setError("Unable to load deals."))
      .finally(() => setIsLoadingDeals(false));
  }, []);

  const onSubmit = async ({ lines }: { lines: QuoteLineInput[] }) => {
    const validLines = lines.filter((line) => line.product_id);
    if (!selectedDealId) {
      setError("Select a deal before saving the quotation.");
      return;
    }
    if (validLines.length === 0) {
      setError("Add at least one product line.");
      return;
    }

    try {
      setError(null);
      setIsSaving(true);
      await quotationsApi.createQuotation({ deal_id: selectedDealId, lines: validLines });
      router.push("/quotations");
    } catch (saveError) {
      console.error("Failed to create quotation", saveError);
      setError("Unable to create the quotation. Check your role and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (user && !["sales_rep", "admin"].includes(user.role)) {
    return (
      <div className="p-8 text-[13px] text-danger">
        Your role can view quotations but cannot create them.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/quotations" className="mb-3 inline-flex items-center gap-1.5 text-[12px] text-foreground-muted hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to quotations
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">New quotation</h1>
          <p className="mt-1 text-[13px] text-foreground-muted">Build a quotation from an existing deal.</p>
        </div>
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={isSaving || isLoadingDeals || isLoadingProducts}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save quotation"}
        </button>
      </div>

      {error && <div className="rounded-md border border-danger/20 bg-danger/10 p-3 text-[13px] font-medium text-danger">{error}</div>}

      <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <label htmlFor="deal" className="mb-2 block text-[13px] font-medium text-foreground">Deal</label>
        <select
          id="deal"
          value={selectedDealId}
          onChange={(event) => setSelectedDealId(event.target.value)}
          disabled={isLoadingDeals || isSaving}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Select a deal...</option>
          {deals.map((deal) => (
            <option key={deal.id} value={deal.id}>
              Deal {deal.id.slice(0, 8)} · ₹{Number(deal.value).toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        {isLoadingProducts ? (
          <p className="text-[13px] text-foreground-muted">Loading products...</p>
        ) : (
          <QuoteLineTable control={control} register={register} products={products || []} />
        )}
      </div>
    </div>
  );
}
