"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await apiClient.post("/auth/forgot-password", { email });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to send reset link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col space-y-6 w-full text-center">
        <div className="flex justify-center text-success mb-2">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div className="flex flex-col space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Check your email</h1>
          <p className="text-[13px] text-foreground-muted max-w-sm mx-auto">
            If an account exists for <strong>{email}</strong>, you will receive an email with instructions on how to reset your password.
          </p>
        </div>
        
        <div className="pt-4">
          <Link href="/login" className="inline-flex w-full items-center justify-center rounded-md text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 shadow-sm">
            Return to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="flex flex-col space-y-1.5 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Reset password</h1>
        <p className="text-[13px] text-foreground-muted">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {error && (
        <div className="p-3 text-[13px] font-medium bg-danger/10 text-danger rounded-md border border-danger/20 text-left">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-foreground" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-[13px] transition-colors placeholder:text-foreground-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          className="inline-flex w-full mt-2 items-center justify-center rounded-md text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 shadow-sm"
          disabled={isSubmitting || !email}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Send reset link"
          )}
        </button>
      </form>

      <div className="text-center text-[13px] text-foreground-muted">
        Remember your password?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
