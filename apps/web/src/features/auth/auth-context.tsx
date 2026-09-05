"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, LoginCredentials, SignupCredentials } from "./types";
import { authApi } from "./api";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: { name?: string; role?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    retry: false,
    // If you don't have a backend running yet, you might want to bypass this for local UI testing
    // by returning a mock user or letting it fail gracefully.
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data);
      router.push(data.role === "customer" ? "/portal" : "/dashboard");
    },
  });

  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data);
      router.push(data.role === "customer" ? "/portal" : "/dashboard");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout();
      } catch (err) {
        console.error("Logout API call error:", err);
      } finally {
        localStorage.removeItem("dealflow_token");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.clear();
      router.replace("/login");
    },
    onError: () => {
      localStorage.removeItem("dealflow_token");
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.clear();
      router.replace("/login");
    },
  });

  const updateMutation = useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data);
    },
  });

  const login = async (credentials: LoginCredentials) => {
    await loginMutation.mutateAsync(credentials);
  };

  const signup = async (credentials: SignupCredentials) => {
    await signupMutation.mutateAsync(credentials);
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      localStorage.removeItem("dealflow_token");
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.clear();
      router.replace("/login");
    }
  };

  const updateUser = async (data: { name?: string; role?: string }) => {
    await updateMutation.mutateAsync(data);
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
