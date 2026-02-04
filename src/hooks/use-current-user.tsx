"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { fetchUserByEmail, hasPermission as checkPermission, PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from "@/lib/firestore/users";
import type { User } from "@/types";

interface CurrentUserContextValue {
  // The user's tenant profile (different from Firebase auth user)
  currentUser: User | null | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  // Permission helpers
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  isCashier: boolean;

  // Quick permission checks
  canViewInventory: boolean;
  canEditInventory: boolean;
  canViewSales: boolean;
  canProcessRefunds: boolean;
  canViewReports: boolean;
  canExportReports: boolean;
  canViewUsers: boolean;
  canManageUsers: boolean;
  canViewSettings: boolean;
  canEditSettings: boolean;
  canViewLocations: boolean;
  canManageLocations: boolean;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isInitialized } = useAuth();

  // Fetch the user's tenant profile by email
  const {
    data: currentUser,
    isLoading: isQueryLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["currentUser", authUser?.email],
    queryFn: () => fetchUserByEmail(authUser!.email!),
    enabled: !!authUser?.email && isInitialized,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isLoading = !isInitialized || isQueryLoading;

  // Permission checking helpers
  const hasPermission = useMemo(() => {
    return (permission: string): boolean => {
      if (!currentUser) return false;
      return checkPermission(currentUser, permission);
    };
  }, [currentUser]);

  const hasAnyPermission = useMemo(() => {
    return (permissions: string[]): boolean => {
      if (!currentUser) return false;
      return permissions.some((p) => checkPermission(currentUser, p));
    };
  }, [currentUser]);

  const hasAllPermissions = useMemo(() => {
    return (permissions: string[]): boolean => {
      if (!currentUser) return false;
      return permissions.every((p) => checkPermission(currentUser, p));
    };
  }, [currentUser]);

  // Role checks
  const isAdmin = currentUser?.role === "admin";
  const isManager = currentUser?.role === "manager";
  const isCashier = currentUser?.role === "cashier";

  // Quick permission checks
  const canViewInventory = hasPermission(PERMISSIONS.INVENTORY_VIEW);
  const canEditInventory = hasPermission(PERMISSIONS.INVENTORY_EDIT);
  const canViewSales = hasPermission(PERMISSIONS.SALES_VIEW);
  const canProcessRefunds = hasPermission(PERMISSIONS.SALES_REFUND);
  const canViewReports = hasPermission(PERMISSIONS.REPORTS_VIEW);
  const canExportReports = hasPermission(PERMISSIONS.REPORTS_EXPORT);
  const canViewUsers = hasPermission(PERMISSIONS.USERS_VIEW);
  const canManageUsers = hasPermission(PERMISSIONS.USERS_EDIT) || hasPermission(PERMISSIONS.USERS_CREATE);
  const canViewSettings = hasPermission(PERMISSIONS.SETTINGS_VIEW);
  const canEditSettings = hasPermission(PERMISSIONS.SETTINGS_EDIT);
  const canViewLocations = hasPermission(PERMISSIONS.LOCATIONS_VIEW);
  const canManageLocations = hasPermission(PERMISSIONS.LOCATIONS_EDIT) || hasPermission(PERMISSIONS.LOCATIONS_CREATE);

  const value: CurrentUserContextValue = {
    currentUser,
    isLoading,
    isError,
    error: error as Error | null,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isManager,
    isCashier,
    canViewInventory,
    canEditInventory,
    canViewSales,
    canProcessRefunds,
    canViewReports,
    canExportReports,
    canViewUsers,
    canManageUsers,
    canViewSettings,
    canEditSettings,
    canViewLocations,
    canManageLocations,
  };

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error("useCurrentUser must be used within a CurrentUserProvider");
  }
  return context;
}

// Re-export PERMISSIONS for convenience
export { PERMISSIONS, DEFAULT_ROLE_PERMISSIONS };
