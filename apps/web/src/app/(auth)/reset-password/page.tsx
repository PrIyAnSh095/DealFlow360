"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { apiClient } from "@/lib/api-client";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !password || !confirmPassword) return;
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      await apiClient.post("/auth/reset-password", { token, new_password: password });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reset password. The link might have expired.");
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
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Password reset successful</h1>
          <p className="text-[13px] text-foreground-muted max-w-sm mx-auto">
            You can now log in with your new password.
          </p>
        </div>
        
        <div className="pt-4">
          <Link href="/login" className="inline-flex w-full items-center justify-center rounded-md text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 shadow-sm">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="flex flex-col space-y-1.5 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Create new password</h1>
        <p className="text-[13px] text-foreground-muted">
          Your new password must be at least 8 characters long.
        </p>
      </div>

      {error && (
        <div className="p-3 text-[13px] font-medium bg-danger/10 text-danger rounded-md border border-danger/20 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-foreground" htmlFor="password">
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 pr-10 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting || !token}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-foreground" htmlFor="confirmPassword">
            Confirm new password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 pr-10 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting || !token}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex w-full mt-2 items-center justify-center rounded-md text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 shadow-sm"
          disabled={isSubmitting || !token || !password || !confirmPassword}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Reset password"
          )}
        </button>
      </form>

      <div className="text-center text-[13px] text-foreground-muted">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
