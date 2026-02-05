"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSettings,
  updateSettings,
  updateBusinessInfo,
  updateTaxSettings,
  updatePaymentMethods,
  updateReceiptSettings,
  updateStockAlertSettings,
  updateGooglePayConfig,
  updateWiPayConfig,
  updateStripeConfig,
  updateDefaultLocation,
  type GooglePayConfig,
  type WiPayConfig,
  type StripeConfig,
} from "@/lib/firestore/settings";
import type { Settings } from "@/types";

// Query keys
export const settingsKeys = {
  all: ["settings"] as const,
};

// Fetch settings
export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: fetchSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Update full settings
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

// Update business info
export function useUpdateBusinessInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBusinessInfo,
    onMutate: async (newInfo) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.all });
      const previous = queryClient.getQueryData<Settings>(settingsKeys.all);
      queryClient.setQueryData<Settings>(settingsKeys.all, (old) =>
        old ? { ...old, ...newInfo } : undefined
      );
      return { previous };
    },
    onError: (_err, _newInfo, context) => {
      if (context?.previous) {
        queryClient.setQueryData(settingsKeys.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

// Update tax settings
export function useUpdateTaxSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTaxSettings,
    onMutate: async (newTax) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.all });
      const previous = queryClient.getQueryData<Settings>(settingsKeys.all);
      queryClient.setQueryData<Settings>(settingsKeys.all, (old) =>
        old ? { ...old, ...newTax } : undefined
      );
      return { previous };
    },
    onError: (_err, _newTax, context) => {
      if (context?.previous) {
        queryClient.setQueryData(settingsKeys.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

// Update payment methods
export function useUpdatePaymentMethods() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePaymentMethods,
    onMutate: async (acceptedPaymentMethodIds) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.all });
      const previous = queryClient.getQueryData<Settings>(settingsKeys.all);
      queryClient.setQueryData<Settings>(settingsKeys.all, (old) =>
        old ? { ...old, acceptedPaymentMethodIds } : undefined
      );
      return { previous };
    },
    onError: (_err, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(settingsKeys.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

// Update receipt settings
export function useUpdateReceiptSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateReceiptSettings,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

// Update stock alert settings
export function useUpdateStockAlertSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStockAlertSettings,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

// Update Google Pay configuration
export function useUpdateGooglePayConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: GooglePayConfig) => updateGooglePayConfig(config),
    onMutate: async (newConfig) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.all });
      const previous = queryClient.getQueryData<Settings>(settingsKeys.all);
      queryClient.setQueryData<Settings>(settingsKeys.all, (old) =>
        old ? { ...old, ...newConfig } : undefined
      );
      return { previous };
    },
    onError: (_err, _newConfig, context) => {
      if (context?.previous) {
        queryClient.setQueryData(settingsKeys.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

// Update WiPay configuration
export function useUpdateWiPayConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: WiPayConfig) => updateWiPayConfig(config),
    onMutate: async (newConfig) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.all });
      const previous = queryClient.getQueryData<Settings>(settingsKeys.all);
      queryClient.setQueryData<Settings>(settingsKeys.all, (old) =>
        old ? { ...old, ...newConfig } : undefined
      );
      return { previous };
    },
    onError: (_err, _newConfig, context) => {
      if (context?.previous) {
        queryClient.setQueryData(settingsKeys.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

// Update Stripe configuration
export function useUpdateStripeConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: StripeConfig) => updateStripeConfig(config),
    onMutate: async (newConfig) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.all });
      const previous = queryClient.getQueryData<Settings>(settingsKeys.all);
      queryClient.setQueryData<Settings>(settingsKeys.all, (old) =>
        old ? { ...old, ...newConfig } : undefined
      );
      return { previous };
    },
    onError: (_err, _newConfig, context) => {
      if (context?.previous) {
        queryClient.setQueryData(settingsKeys.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

// Update default location for receipts
export function useUpdateDefaultLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locationId: string | null) => updateDefaultLocation(locationId),
    onMutate: async (locationId) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.all });
      const previous = queryClient.getQueryData<Settings>(settingsKeys.all);
      queryClient.setQueryData<Settings>(settingsKeys.all, (old) =>
        old ? { ...old, defaultLocationId: locationId ?? undefined } : undefined
      );
      return { previous };
    },
    onError: (_err, _locationId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(settingsKeys.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}
