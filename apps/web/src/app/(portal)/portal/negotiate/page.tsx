"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { customerApi } from "@/features/customer/api";

export default function NegotiatePage() {
  const router = useRouter();

  useEffect(() => {
    customerApi.getQuotations().then(quotes => {
      const negotiating = quotes.find(
        (q) => q.status === "NEGOTIATION" || q.status === "SENT"
      );
      if (negotiating) {
        router.push(`/portal/quotations/${negotiating.id}`);
      } else {
        router.push("/portal/quotations");
      }
    });
  }, [router]);

  return <div className="p-8 text-[13px] text-foreground-muted flex items-center justify-center">Redirecting...</div>;
}
