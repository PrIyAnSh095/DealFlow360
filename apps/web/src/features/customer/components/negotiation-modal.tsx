"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Tag,
  Hash,
  Percent,
  MessageSquare,
  MoreHorizontal,
  Send,
  ChevronRight,
  AlertCircle,
  Check,
  IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuotationLineItem, NegotiationRequestType } from "@/features/customer/types";

interface NegotiationModalProps {
  lineItem: QuotationLineItem;
  onClose: () => void;
  onSubmit: (request: {
    type: NegotiationRequestType;
    requestedPrice?: number;
    requestedQty?: number;
    requestedDiscount?: number;
    message: string;
  }) => void;
}

const REQUEST_TYPES: {
  type: NegotiationRequestType;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    type: "price",
    label: "Request a different price",
    icon: <IndianRupee className="w-4 h-4" />,
    description: "Propose a lower unit price for this item",
  },
  {
    type: "quantity",
    label: "Request a different quantity",
    icon: <Hash className="w-4 h-4" />,
    description: "Adjust the number of units",
  },
  {
    type: "discount",
    label: "Request a different discount",
    icon: <Percent className="w-4 h-4" />,
    description: "Propose a higher discount percentage",
  },
  {
    type: "question",
    label: "Ask a question",
    icon: <MessageSquare className="w-4 h-4" />,
    description: "Ask about specs, delivery, or terms",
  },
  {
    type: "other",
    label: "Other request",
    icon: <MoreHorizontal className="w-4 h-4" />,
    description: "Something else not listed above",
  },
];

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function NegotiationModal({
  lineItem,
  onClose,
  onSubmit,
}: NegotiationModalProps) {
  const [step, setStep] = useState<"select" | "details">("select");
  const [selectedType, setSelectedType] = useState<NegotiationRequestType | null>(null);
  const [requestedPrice, setRequestedPrice] = useState(lineItem.finalPrice);
  const [requestedQty, setRequestedQty] = useState(lineItem.qty);
  const [requestedDiscount, setRequestedDiscount] = useState(lineItem.discount);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const sliderRef = useRef<HTMLInputElement>(null);

  // Slider min/max for price
  const priceMin = Math.round(lineItem.finalPrice * 0.6);
  const priceMax = lineItem.finalPrice;
  const discountMin = lineItem.discount;
  const discountMax = Math.min(lineItem.discount + 30, 50);

  const sliderPercent =
    selectedType === "price"
      ? ((requestedPrice - priceMin) / (priceMax - priceMin)) * 100
      : selectedType === "discount"
      ? ((requestedDiscount - discountMin) / (discountMax - discountMin)) * 100
      : 0;

  function handleTypeSelect(type: NegotiationRequestType) {
    setSelectedType(type);
    setStep("details");
  }

  function handleSubmit() {
    if (!selectedType) return;
    onSubmit({
      type: selectedType,
      requestedPrice: selectedType === "price" ? requestedPrice : undefined,
      requestedQty: selectedType === "quantity" ? requestedQty : undefined,
      requestedDiscount:
        selectedType === "discount" ? requestedDiscount : undefined,
      message,
    });
    setSubmitted(true);
  }

  const canSubmit = message.trim().length > 0 || selectedType === "price" || selectedType === "quantity" || selectedType === "discount";
  const savings =
    selectedType === "price" ? (lineItem.finalPrice - requestedPrice) * lineItem.qty : 0;

  // Close on overlay click
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  if (submitted) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
        onClick={handleOverlayClick}
      >
        <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mb-4">
            <Check className="w-7 h-7 text-success" />
          </div>
          <h2 className="text-[18px] font-bold text-foreground mb-2">
            Request Sent!
          </h2>
          <p className="text-[13px] text-foreground-muted max-w-xs mb-6">
            Your negotiation request for{" "}
            <span className="font-medium text-foreground">
              {lineItem.productName}
            </span>{" "}
            has been sent to your sales representative. You'll be notified once
            they respond.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            {step === "details" && (
              <button
                onClick={() => setStep("select")}
                className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-muted text-foreground-muted hover:text-foreground transition-colors mr-1"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            )}
            <div>
              <h2 className="text-[16px] font-bold text-foreground leading-tight">
                Negotiate: {lineItem.productName}
              </h2>
              <p className="text-[12px] text-foreground-muted mt-0.5">
                Current price:{" "}
                <span className="font-semibold text-foreground">
                  {formatINR(lineItem.finalPrice)}
                  {lineItem.isRecurring ? "/mo" : ""}
                </span>{" "}
                · Qty:{" "}
                <span className="font-semibold text-foreground">
                  {lineItem.qty}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-muted text-foreground-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* STEP 1: Select type */}
          {step === "select" && (
            <div>
              <p className="text-[13px] text-foreground-muted mb-4">
                What would you like to change?
              </p>
              <div className="space-y-2">
                {REQUEST_TYPES.map((rt) => (
                  <button
                    key={rt.type}
                    onClick={() => handleTypeSelect(rt.type)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all group",
                      "border-border hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    <span className="w-8 h-8 rounded-md bg-muted group-hover:bg-primary/10 flex items-center justify-center text-foreground-muted group-hover:text-primary transition-colors shrink-0">
                      {rt.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground">
                        {rt.label}
                      </p>
                      <p className="text-[11px] text-foreground-muted">
                        {rt.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-primary transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Details */}
          {step === "details" && selectedType && (
            <div className="space-y-6">
              {/* PRICE */}
              {selectedType === "price" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[13px] font-semibold text-foreground">
                      Your requested price (per unit)
                    </label>
                    <span className="text-[12px] text-foreground-muted">
                      Current: {formatINR(lineItem.finalPrice)}
                    </span>
                  </div>

                  {/* Slider */}
                  <div className="mt-4 mb-2 relative">
                    <div className="relative h-2 bg-muted rounded-full">
                      <div
                        className="absolute h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${sliderPercent}%` }}
                      />
                    </div>
                    <input
                      ref={sliderRef}
                      type="range"
                      min={priceMin}
                      max={priceMax}
                      step={500}
                      value={requestedPrice}
                      onChange={(e) => setRequestedPrice(Number(e.target.value))}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
                    />
                    {/* Thumb */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary border-2 border-surface shadow-md transition-all pointer-events-none"
                      style={{ left: `${sliderPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-foreground-muted mb-4">
                    <span>{formatINR(priceMin)}</span>
                    <span className="font-bold text-[14px] text-primary">
                      {formatINR(requestedPrice)}
                    </span>
                    <span>{formatINR(priceMax)}</span>
                  </div>

                  {/* Direct input */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted text-[13px] font-medium">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={priceMin}
                      max={priceMax}
                      value={requestedPrice}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (v >= priceMin && v <= priceMax)
                          setRequestedPrice(v);
                      }}
                      className="w-full pl-7 pr-4 py-2.5 bg-background border border-border rounded-md text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Savings indicator */}
                  {savings > 0 && (
                    <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-success/5 border border-success/20">
                      <Tag className="w-4 h-4 text-success shrink-0" />
                      <p className="text-[12px] text-success font-medium">
                        You're requesting{" "}
                        <strong>{formatINR(savings)}</strong> in savings across{" "}
                        {lineItem.qty} units (
                        {(((lineItem.finalPrice - requestedPrice) / lineItem.finalPrice) * 100).toFixed(1)}% off current price)
                      </p>
                    </div>
                  )}
                  {requestedPrice >= lineItem.finalPrice && (
                    <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-warning/5 border border-warning/20">
                      <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                      <p className="text-[12px] text-warning">
                        Move the slider left or enter a lower price to request a
                        discount.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* QUANTITY */}
              {selectedType === "quantity" && (
                <div>
                  <label className="text-[13px] font-semibold text-foreground block mb-3">
                    Your requested quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setRequestedQty(Math.max(1, requestedQty - 1))
                      }
                      className="w-10 h-10 rounded-md border border-border bg-background flex items-center justify-center text-foreground text-lg font-bold hover:bg-muted transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={requestedQty}
                      onChange={(e) =>
                        setRequestedQty(Math.max(1, Number(e.target.value)))
                      }
                      className="flex-1 text-center py-2.5 bg-background border border-border rounded-md text-[16px] font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    <button
                      onClick={() => setRequestedQty(requestedQty + 1)}
                      className="w-10 h-10 rounded-md border border-border bg-background flex items-center justify-center text-foreground text-lg font-bold hover:bg-muted transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-[11px] text-foreground-muted mt-2">
                    Current quantity: {lineItem.qty}
                  </p>
                </div>
              )}

              {/* DISCOUNT */}
              {selectedType === "discount" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[13px] font-semibold text-foreground">
                      Your requested discount
                    </label>
                    <span className="text-[12px] text-foreground-muted">
                      Current: {lineItem.discount}%
                    </span>
                  </div>
                  <div className="mt-4 mb-2 relative">
                    <div className="relative h-2 bg-muted rounded-full">
                      <div
                        className="absolute h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${sliderPercent}%` }}
                      />
                    </div>
                    <input
                      type="range"
                      min={discountMin}
                      max={discountMax}
                      step={1}
                      value={requestedDiscount}
                      onChange={(e) =>
                        setRequestedDiscount(Number(e.target.value))
                      }
                      className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary border-2 border-surface shadow-md transition-all pointer-events-none"
                      style={{ left: `${sliderPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-foreground-muted mb-4">
                    <span>{discountMin}%</span>
                    <span className="font-bold text-[14px] text-primary">
                      {requestedDiscount}%
                    </span>
                    <span>{discountMax}%</span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min={discountMin}
                      max={discountMax}
                      value={requestedDiscount}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (v >= discountMin && v <= discountMax)
                          setRequestedDiscount(v);
                      }}
                      className="w-full pr-8 pl-4 py-2.5 bg-background border border-border rounded-md text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted text-[13px] font-medium">
                      %
                    </span>
                  </div>

                  {requestedDiscount > lineItem.discount && (
                    <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-success/5 border border-success/20">
                      <Tag className="w-4 h-4 text-success shrink-0" />
                      <p className="text-[12px] text-success font-medium">
                        New price after requested discount:{" "}
                        <strong>
                          {formatINR(
                            lineItem.unitPrice *
                              (1 - requestedDiscount / 100)
                          )}
                        </strong>{" "}
                        per unit
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* QUESTION / OTHER */}
              {(selectedType === "question" || selectedType === "other") && (
                <div>
                  <label className="text-[13px] font-semibold text-foreground block mb-3">
                    {selectedType === "question"
                      ? "Your question"
                      : "Describe your request"}
                  </label>
                  <p className="text-[12px] text-foreground-muted mb-3">
                    {selectedType === "question"
                      ? "Ask about product specifications, delivery timeline, payment terms, or anything else."
                      : "Describe what change or special arrangement you're looking for."}
                  </p>
                </div>
              )}

              {/* Reason / Message (for all types) */}
              <div>
                <label className="text-[13px] font-semibold text-foreground block mb-2">
                  {selectedType === "question" || selectedType === "other"
                    ? "Message"
                    : "Reason for request"}{" "}
                  <span className="text-danger">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    selectedType === "price"
                      ? "e.g. We are ordering 10 units and would like a volume discount..."
                      : selectedType === "quantity"
                      ? "e.g. We need to reduce the order to 8 units due to budget constraints..."
                      : selectedType === "discount"
                      ? "e.g. We're a long-term customer and believe a 15% discount is justified..."
                      : selectedType === "question"
                      ? "Type your question here..."
                      : "Describe your request..."
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-md text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-foreground-muted"
                />
                <p className="text-[11px] text-foreground-muted mt-1.5">
                  A clear reason increases the chance of acceptance.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "details" && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3 bg-muted/30">
            <button
              onClick={() => setStep("select")}
              className="px-4 py-2 rounded-md border border-border bg-surface text-[13px] font-medium text-foreground-muted hover:text-foreground hover:bg-muted transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!message.trim() && selectedType !== "price" && selectedType !== "quantity" && selectedType !== "discount"}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-md text-[13px] font-medium transition-all",
                message.trim() || selectedType === "price" || selectedType === "quantity" || selectedType === "discount"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                  : "bg-muted text-foreground-muted cursor-not-allowed"
              )}
            >
              <Send className="w-3.5 h-3.5" />
              Send Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
