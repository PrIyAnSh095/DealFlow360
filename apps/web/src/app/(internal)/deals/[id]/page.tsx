"use client";

import { useForm, useWatch } from "react-hook-form";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QuoteLineTable } from "@/features/quotations/components/quote-line-table";
import { RiskSimulatorPanel } from "@/features/quotations/components/risk-simulator-panel";
import { useProducts, useRecalculateQuote } from "@/features/quotations/hooks";
import { QuoteRecalculateResponse, QuoteRecalculateRequest, QuoteLineInput } from "@/features/quotations/types";
import { Save, FileText, Copy } from "lucide-react";

export default function DealPage() {
  const params = useParams();
  const dealId = params.id as string;
  
  const { data: products } = useProducts();
  const recalculateMutation = useRecalculateQuote();
  
  const [simulation, setSimulation] = useState<QuoteRecalculateResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const { control, register, handleSubmit } = useForm<{ lines: QuoteLineInput[] }>({
    defaultValues: {
      lines: [
        { product_id: "", quantity: 1, discount_percent: 0 }
      ]
    }
  });

  // Watch for changes in lines to trigger live recalculation
  const watchedLines = useWatch({
    control,
    name: "lines",
  });

  useEffect(() => {
    // Only run if we have lines and valid products selected
    const validLines = watchedLines?.filter(l => l.product_id && l.product_id !== "") || [];
    
    if (validLines.length > 0) {
      setIsSimulating(true);
      const timer = setTimeout(() => {
        const req: QuoteRecalculateRequest = {
          lines: validLines.map(l => ({
            product_id: l.product_id,
            quantity: l.quantity || 1,
            discount_percent: l.discount_percent || 0
          }))
        };
        
        recalculateMutation.mutateAsync({ quotationId: dealId, request: req })
          .then(data => {
            setSimulation(data);
          })
          .catch(err => {
            console.error("Simulation error", err);
          })
          .finally(() => {
            setIsSimulating(false);
          });
      }, 500); // 500ms debounce
      
      return () => clearTimeout(timer);
    } else {
      setSimulation(null);
    }
  }, [watchedLines, dealId]); // intentionally excluding recalculateMutation to prevent infinite loops

  const onSave = async (data: { lines: QuoteLineInput[] }) => {
    // In a full implementation, this would save the actual quote lines to the DB
    console.log("Saving final quote:", data, simulation);
    alert("Quote saved successfully!");
  };

  const copyPortalLink = () => {
    const url = `${window.location.origin}/portal/${dealId}`;
    navigator.clipboard.writeText(url);
    alert("Customer Portal link copied to clipboard!");
  };

  if (!products) {
    return <div className="p-8 text-[13px] text-foreground-muted">Loading deal workspace...</div>;
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      
      {/* Top Header */}
      <div className="shrink-0 h-16 border-b border-border bg-background px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Deal Workspace</h1>
            <p className="text-[12px] text-foreground-muted">Drafting Quotation #{dealId.substring(0,8)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={copyPortalLink}
            className="h-8 px-3 rounded-md text-[13px] font-medium text-foreground-muted hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Portal Link
          </button>
          <button 
            type="button" 
            className="h-8 px-3 rounded-md text-[13px] font-medium text-foreground-muted hover:text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSubmit(onSave)}
            className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-[13px] font-medium flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Save Quote
          </button>
        </div>
      </div>

      {/* Main Content Area - Split View */}
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="max-w-[1200px] mx-auto p-6 h-full flex items-start gap-6">
          
          {/* Left Column: Line Items (70%) */}
          <div className="flex-1 min-w-0">
            <div className="bg-background rounded-lg border border-border p-5 shadow-sm">
              <form onSubmit={handleSubmit(onSave)}>
                <QuoteLineTable control={control} register={register} products={products} />
              </form>
            </div>
          </div>
          
          {/* Right Column: Risk Simulator (30%) */}
          <div className="w-[320px] shrink-0 sticky top-6">
            <RiskSimulatorPanel simulation={simulation} isLoading={isSimulating} />
          </div>
          
        </div>
      </div>
    </div>
  );
}
