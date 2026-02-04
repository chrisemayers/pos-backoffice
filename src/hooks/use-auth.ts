"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import {
  signIn as authSignIn,
  signOut as authSignOut,
  signInWithGoogle as authSignInWithGoogle,
  onAuthChange,
  getAuthErrorMessage,
} from "@/lib/auth";

export function useAuth() {
  const { user, isLoading, isInitialized, setUser, setInitialized } = useAuthStore();
  const router = useRouter();

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      if (!isInitialized) {
        setInitialized();
      }
    });

    return unsubscribe;
  }, [setUser, setInitialized, isInitialized]);

  // Sign in with email/password
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        await authSignIn(email, password);
        router.push("/");
      } catch (error: unknown) {
        const code = (error as { code?: string })?.code || "";
        throw new Error(getAuthErrorMessage(code));
      }
    },
    [router]
  );

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    try {
      await authSignInWithGoogle();
      router.push("/");
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code || "";
      throw new Error(getAuthErrorMessage(code));
    }
  }, [router]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await authSignOut();
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }, [router]);

  return {
    user,
    isLoading,
    isInitialized,
    isAuthenticated: !!user,
    signIn,
    signInWithGoogle,
    signOut,
  };
}

// Hook for requiring auth - redirects to login if not authenticated
export function useRequireAuth() {
  const { user, isLoading, isInitialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, isInitialized, router]);

  return { user, isLoading: isLoading || !isInitialized };
}
