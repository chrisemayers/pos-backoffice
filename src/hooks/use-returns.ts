"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchReturns,
  fetchReturn,
  fetchReturnsForSale,
  getRecentReturns,
  getReturnsSummary,
  getTodaysReturnsSummary,
  type ReturnFilters,
} from "@/lib/firestore/returns";

// Query keys factory
export const returnsKeys = {
  all: ["returns"] as const,
  lists: () => [...returnsKeys.all, "list"] as const,
  list: (filters: ReturnFilters) => [...returnsKeys.lists(), filters] as const,
  details: () => [...returnsKeys.all, "detail"] as const,
  detail: (id: string) => [...returnsKeys.details(), id] as const,
  forSale: (saleId: string) => [...returnsKeys.all, "sale", saleId] as const,
  summary: (startDate: Date, endDate: Date) =>
    [...returnsKeys.all, "summary", startDate.toISOString(), endDate.toISOString()] as const,
  recent: (count: number) => [...returnsKeys.all, "recent", count] as const,
  today: () => [...returnsKeys.all, "today"] as const,
};

// List returns with filters
export function useReturns(filters?: ReturnFilters) {
  return useQuery({
    queryKey: returnsKeys.list(filters ?? {}),
    queryFn: () => fetchReturns(filters),
  });
}

// Single return by ID
export function useReturn(id: string) {
  return useQuery({
    queryKey: returnsKeys.detail(id),
    queryFn: () => fetchReturn(id),
    enabled: !!id,
  });
}

// Returns for a specific sale
export function useReturnsForSale(saleId: string) {
  return useQuery({
    queryKey: returnsKeys.forSale(saleId),
    queryFn: () => fetchReturnsForSale(saleId),
    enabled: !!saleId,
  });
}

// Recent returns (for dashboard)
export function useRecentReturns(count: number = 5) {
  return useQuery({
    queryKey: returnsKeys.recent(count),
    queryFn: () => getRecentReturns(count),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Returns summary for date range
export function useReturnsSummary(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: returnsKeys.summary(startDate, endDate),
    queryFn: () => getReturnsSummary(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

// Today's returns summary (for dashboard)
export function useTodaysReturnsSummary() {
  return useQuery({
    queryKey: returnsKeys.today(),
    queryFn: getTodaysReturnsSummary,
    staleTime: 60 * 1000, // 1 minute
  });
}
