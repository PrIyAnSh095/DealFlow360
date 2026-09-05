"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginCredentials } from "@/features/auth/types";
import { useAuth } from "@/features/auth/auth-context";
import Link from "next/link";
import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginCredentials) => {
    try {
      setError(null);
      await login(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid email or password.");
    }
  };

  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="flex flex-col space-y-1.5 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Welcome back</h1>
        <p className="text-[13px] text-foreground-muted">
          Sign in to your DealFlow360 workspace
        </p>
      </div>
      
      {error && (
        <div className="p-3 text-[13px] font-medium bg-danger/10 text-danger rounded-md border border-danger/20 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-foreground" htmlFor="email">
            Email address
          </label>
          <input
            {...register("email")}
            id="email"
            type="email"
            placeholder="name@company.com"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-[13px] transition-colors placeholder:text-foreground-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-[12px] font-medium text-danger">{errors.email.message}</p>
          )}
        </div>
        
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-medium text-foreground" htmlFor="password">
              Password
            </label>
            <Link href="/forgot-password" className="text-[12px] font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            {...register("password")}
            id="password"
            type="password"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
          />
          {errors.password && (
            <p className="text-[12px] font-medium text-danger">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          className="inline-flex w-full mt-2 items-center justify-center rounded-md text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 shadow-sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <div className="text-center text-[13px] text-foreground-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Request access
        </Link>
      </div>
    </div>
  );
}
