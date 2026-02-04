"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { onAuthChange } from "@/lib/auth";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setInitialized, isInitialized } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      if (!isInitialized) {
        setInitialized();
      }
    });

    return unsubscribe;
  }, [setUser, setInitialized, isInitialized]);

  return <>{children}</>;
}
