"use client";

import React, { createContext, useContext, useSyncExternalStore } from "react";
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

const subscribeToToken = (onChange: () => void) => {
  if (typeof window === "undefined") return () => {};

  const handleStorageChange = () => onChange();
  window.addEventListener("storage", handleStorageChange);
  window.addEventListener("dealflow-auth-change", handleStorageChange);
  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener("dealflow-auth-change", handleStorageChange);
  };
};

const getTokenSnapshot = () =>
  typeof window !== "undefined" && Boolean(localStorage.getItem("dealflow_token"));

const getServerTokenSnapshot = () => false;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const hasToken = useSyncExternalStore(
    subscribeToToken,
    getTokenSnapshot,
    getServerTokenSnapshot
  );

  const { data: user, isPending } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    enabled: isMounted && hasToken,
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data);
      window.dispatchEvent(new Event("dealflow-auth-change"));
      router.push(data.role === "customer" ? "/portal" : "/dashboard");
    },
  });

  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data);
      window.dispatchEvent(new Event("dealflow-auth-change"));
      router.push(data.role === "customer" ? "/portal" : "/dashboard");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], null);
      window.dispatchEvent(new Event("dealflow-auth-change"));
      router.push("/login");
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
    await logoutMutation.mutateAsync();
  };

  const updateUser = async (data: { name?: string; role?: string }) => {
    await updateMutation.mutateAsync(data);
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading: !isMounted || (hasToken && isPending),
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
