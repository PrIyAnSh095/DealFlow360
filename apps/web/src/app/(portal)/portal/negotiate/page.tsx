"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { customerApi } from "@/features/customer/api";
import { MessageSquareDiff } from "lucide-react";
import Link from "next/link";

export default function NegotiatePage() {
  const router = useRouter();
  const [noActive, setNoActive] = useState(false);

  useEffect(() => {
    customerApi
      .getQuotations()
      .then((quotes) => {
        const negotiating = quotes.find(
          (q) => q.status !== "ACCEPTED" && q.status !== "REJECTED"
        );
        if (negotiating) {
          router.push(`/portal/quotations/${negotiating.id}`);
        } else {
          setNoActive(true);
        }
      })
      .catch((err) => {
        console.error("Failed to load quotations for negotiation:", err);
        setNoActive(true);
      });
  }, [router]);

  if (noActive) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
          <MessageSquareDiff className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          No Active Negotiations
        </h1>
        <p className="text-[14px] text-foreground-muted max-w-md mb-6">
          You don't have any open quotations that require negotiation right now.
        </p>
        <Link
          href="/portal/quotations"
          className="px-6 py-2.5 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors"
        >
          View Past Quotations →
        </Link>
      </div>
    );
  }

  return <div className="p-8 text-[13px] text-foreground-muted flex items-center justify-center h-[60vh]">Finding active negotiation...</div>;
}
