"use client";

import { redirect } from "next/navigation";
import { mockQuotations } from "@/features/customer/mock-data";

// /portal/negotiate redirects to the first active negotiating quotation
export default function NegotiatePage() {
  const negotiating = mockQuotations.find(
    (q) => q.status === "negotiating" || q.status === "sent"
  );
  if (negotiating) {
    redirect(`/portal/quotations/${negotiating.id}`);
  }
  redirect("/portal/quotations");
}
