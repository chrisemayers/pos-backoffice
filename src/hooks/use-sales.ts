"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchSales,
  fetchSale,
  fetchSaleByReceiptId,
  getSalesSummary,
  getRecentSales,
  getTodaysSummary,
  type SaleFilters,
} from "@/lib/firestore/sales";

// Query keys factory
export const salesKeys = {
  all: ["sales"] as const,
  lists: () => [...salesKeys.all, "list"] as const,
  list: (filters: SaleFilters) => [...salesKeys.lists(), filters] as const,
  details: () => [...salesKeys.all, "detail"] as const,
  detail: (id: string) => [...salesKeys.details(), id] as const,
  byReceipt: (receiptId: string) => [...salesKeys.all, "receipt", receiptId] as const,
  summary: (startDate: Date, endDate: Date) =>
    [...salesKeys.all, "summary", startDate.toISOString(), endDate.toISOString()] as const,
  recent: (count: number) => [...salesKeys.all, "recent", count] as const,
  today: () => [...salesKeys.all, "today"] as const,
};

// List sales
export function useSales(filters?: SaleFilters) {
  return useQuery({
    queryKey: salesKeys.list(filters ?? {}),
    queryFn: () => fetchSales(filters),
  });
}

// Single sale
export function useSale(id: string) {
  return useQuery({
    queryKey: salesKeys.detail(id),
    queryFn: () => fetchSale(id),
    enabled: !!id,
  });
}

// Sale by receipt ID
export function useSaleByReceiptId(receiptId: string) {
  return useQuery({
    queryKey: salesKeys.byReceipt(receiptId),
    queryFn: () => fetchSaleByReceiptId(receiptId),
    enabled: !!receiptId,
  });
}

// Sales summary for date range
export function useSalesSummary(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: salesKeys.summary(startDate, endDate),
    queryFn: () => getSalesSummary(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

// Recent sales (for dashboard)
export function useRecentSales(count: number = 5) {
  return useQuery({
    queryKey: salesKeys.recent(count),
    queryFn: () => getRecentSales(count),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Today's summary (for dashboard)
export function useTodaysSummary() {
  return useQuery({
    queryKey: salesKeys.today(),
    queryFn: getTodaysSummary,
    staleTime: 60 * 1000, // 1 minute
  });
}
