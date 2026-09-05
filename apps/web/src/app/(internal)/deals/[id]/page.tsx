"use client";

import { useForm, useWatch } from "react-hook-form";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { QuoteLineTable } from "@/features/quotations/components/quote-line-table";
import { RiskSimulatorPanel } from "@/features/quotations/components/risk-simulator-panel";
import { useProducts, useRecalculateQuote } from "@/features/quotations/hooks";
import { QuoteRecalculateResponse, QuoteRecalculateRequest, QuoteLineInput, QuotationCreate } from "@/features/quotations/types";
import { quotationsApi } from "@/features/quotations/api";
import { dealsApi } from "@/features/deals/api";
import { Deal, RiskLevel } from "@/features/deals/types";
import { Save, FileText, Copy, Send, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth } from "@/features/auth/auth-context";
import AIExplanationModal from "@/components/AIExplanationModal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DealPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  const { user } = useAuth();
  
  const { data: products } = useProducts();
  const recalculateMutation = useRecalculateQuote();
  
  const [deal, setDeal] = useState<Deal | null>(null);
  const [dealLoading, setDealLoading] = useState(true);
  const [simulation, setSimulation] = useState<QuoteRecalculateResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // AI Modal States
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiData, setAIData] = useState<any>(null);

  const { control, register, handleSubmit } = useForm<{ lines: QuoteLineInput[] }>({
    defaultValues: {
      lines: [
        { product_id: "", quantity: 1, discount_percent: 0 }
      ]
    }
  });

  const watchedLines = useWatch({
    control,
    name: "lines",
  });

  useEffect(() => {
    dealsApi.getDeal(dealId)
      .then(setDeal)
      .catch(err => {
        toast.error("Failed to load deal information");
      })
      .finally(() => setDealLoading(false));
  }, [dealId]);

  useEffect(() => {
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
        
        recalculateMutation.mutate({ quotationId: activeQuoteId || dealId, request: req }, {
          onSuccess: (data) => {
            setSimulation(data);
            setIsSimulating(false);
          },
          onError: () => {
            setIsSimulating(false);
          }
        });
      }, 500); // 500ms debounce
      
      return () => clearTimeout(timer);
    } else {
      setSimulation(null);
    }
  }, [watchedLines, dealId, activeQuoteId]);

  const onSave = async (data: { lines: QuoteLineInput[] }) => {
    setIsSaving(true);
    try {
      const validLines = data.lines.filter(l => l.product_id && l.product_id !== "");
      if (validLines.length === 0) {
        toast.error("Please add at least one product.");
        return;
      }
      
      const request: QuotationCreate = {
        deal_id: dealId,
        lines: validLines.map(l => ({
          product_id: l.product_id,
          quantity: l.quantity,
          discount_percent: l.discount_percent
        }))
      };
      
      const quotation = await quotationsApi.createQuotation(request);
      setActiveQuoteId(quotation.id);
      
      setDeal(prev => prev ? { ...prev, value: quotation.total, risk: quotation.risk_score.toLowerCase() as RiskLevel } : prev);
      
      toast.success(`Quote QT-${quotation.id.slice(0, 6)} saved successfully!`);
    } catch (err) {
      toast.error("Failed to save quote. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitApproval = async () => {
    if (!activeQuoteId) {
      toast.error("Please save the quote first before submitting.");
      return;
    }
    
    setIsSubmittingAuth(true);
    try {
      const result = await quotationsApi.submitQuotation(activeQuoteId);
      toast.success(`Quote submitted. Status: ${result.status}`);
      router.push("/deals");
    } catch (err) {
      toast.error("Failed to submit quote for approval.");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const copyPortalLink = () => {
    const targetId = activeQuoteId || dealId;
    const url = `${window.location.origin}/portal/${targetId}`;
    navigator.clipboard.writeText(url);
    toast.success("Customer Portal link copied to clipboard!");
  };

  const handleOpenAIExplanation = async () => {
    try {
      setIsAIModalOpen(true);
      setIsAILoading(true);
      const token = localStorage.getItem("dealflow_token");
      const quoteTarget = activeQuoteId || "q-1";
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/quotations/${quoteTarget}/ai-explanation`,
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
      setAIData(res.data);
    } catch (err: any) {
      console.error("AI explanation error:", err);
      setAIData({
        ai_status: "error",
        summary: "Could not retrieve AI explanation. Check permissions.",
        risks: ["Authorization check or API error."],
        recommendations: ["Ensure your account role is authorized."]
      });
    } finally {
      setIsAILoading(false);
    }
  };

  const isAuthorizedForAI = !user || ["sales", "sales_rep", "manager", "sales_manager", "finance", "ops", "admin"].includes(user.role?.toLowerCase() || "");

  if (!products || dealLoading) {
    return (
      <div className="p-8 text-[13px] text-foreground-muted flex items-center justify-center h-full gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading deal workspace...
      </div>
    );
  }

  if (!deal) {
    return <div className="p-8 text-[13px] text-danger">Deal not found.</div>;
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
            <h1 className="text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-[400px]">
              {deal.customer?.name} - {deal.customer?.company}
            </h1>
            <p className="text-[12px] text-foreground-muted">
              {activeQuoteId ? `Quote QT-${activeQuoteId.slice(0,6)}` : `Drafting for Deal ${dealId.substring(0,8)}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Unobtrusive ⓘ AI Button on top-right of quotation workspace */}
          {isAuthorizedForAI && (
            <button
              type="button"
              onClick={handleOpenAIExplanation}
              className="h-8 px-3 rounded-md bg-primary/10 border border-primary/20 text-primary text-[13px] font-medium flex items-center gap-1.5 hover:bg-primary/20 transition-all shadow-sm"
              title="Explain Quotation with AI (Local Ollama Intelligence)"
            >
              <Info className="w-4 h-4" />
              <span className="font-semibold">ⓘ Explain with AI</span>
            </button>
          )}

          <button 
            type="button" 
            onClick={copyPortalLink}
            className="hidden sm:flex h-8 px-3 rounded-md text-[13px] font-medium text-foreground-muted hover:text-foreground hover:bg-muted transition-colors items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Portal Link
          </button>
          <Link 
            href="/deals"
            className="h-8 flex items-center px-3 rounded-md text-[13px] font-medium text-foreground-muted hover:text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
          
          <button 
            type="button"
            onClick={handleSubmit(onSave)}
            disabled={isSaving}
            className="h-8 px-3 rounded-md border border-primary text-primary text-[13px] font-medium flex items-center gap-1.5 hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Quote
          </button>

          <button 
            type="button"
            onClick={onSubmitApproval}
            disabled={isSubmittingAuth || !activeQuoteId}
            className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-[13px] font-medium flex items-center gap-1.5 hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmittingAuth ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Submit
          </button>
        </div>
      </div>

      {/* Main Content Area - Split View */}
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="max-w-[1200px] mx-auto p-6 h-full flex flex-col lg:flex-row items-start gap-6">
          
          {/* Left Column: Line Items */}
          <div className="flex-1 min-w-0 w-full">
            <div className="bg-background rounded-lg border border-border p-5 shadow-sm relative">
              
              {/* Unobtrusive Card Top-Right ⓘ AI Button */}
              {isAuthorizedForAI && (
                <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
                  <button
                    type="button"
                    onClick={handleOpenAIExplanation}
                    className="p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all"
                    title="Explain Quotation with AI"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit(onSave)}>
                <QuoteLineTable control={control} register={register} products={products} />
              </form>
            </div>
          </div>
          
          {/* Right Column: Risk Simulator */}
          <div className="w-full lg:w-[320px] shrink-0 sticky top-6">
            <RiskSimulatorPanel simulation={simulation} isLoading={isSimulating} />
          </div>
          
        </div>
      </div>

      {/* AI Explanation Modal */}
      <AIExplanationModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        isLoading={isAILoading}
        data={aiData}
        quoteId={activeQuoteId || dealId}
      />

    </div>
  );
}

