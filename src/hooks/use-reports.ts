"use client";

import { useQuery } from "@tanstack/react-query";
import { getSalesReport, getComparisonReport } from "@/lib/firestore/reports";

// Query keys factory
export const reportKeys = {
  all: ["reports"] as const,
  sales: (startDate: Date, endDate: Date) =>
    [...reportKeys.all, "sales", startDate.toISOString(), endDate.toISOString()] as const,
  comparison: (
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date
  ) =>
    [
      ...reportKeys.all,
      "comparison",
      currentStart.toISOString(),
      currentEnd.toISOString(),
      previousStart.toISOString(),
      previousEnd.toISOString(),
    ] as const,
};

// Sales report for date range
export function useSalesReport(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: reportKeys.sales(startDate, endDate),
    queryFn: () => getSalesReport(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Comparison report (current vs previous period)
export function useComparisonReport(
  currentStart: Date,
  currentEnd: Date,
  previousStart: Date,
  previousEnd: Date
) {
  return useQuery({
    queryKey: reportKeys.comparison(currentStart, currentEnd, previousStart, previousEnd),
    queryFn: () =>
      getComparisonReport(currentStart, currentEnd, previousStart, previousEnd),
    enabled: !!currentStart && !!currentEnd && !!previousStart && !!previousEnd,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Helper: Get date ranges for common periods
export function useDateRanges() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Today
  const todayStart = today;
  const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  // This week (Monday to Sunday)
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() + mondayOffset);
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 7);

  // Last week
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);

  // This month
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  // Last month
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1);

  // Last 7 days
  const last7DaysStart = new Date(today);
  last7DaysStart.setDate(today.getDate() - 7);
  const last7DaysEnd = todayEnd;

  // Last 30 days
  const last30DaysStart = new Date(today);
  last30DaysStart.setDate(today.getDate() - 30);
  const last30DaysEnd = todayEnd;

  return {
    today: { start: todayStart, end: todayEnd },
    thisWeek: { start: thisWeekStart, end: thisWeekEnd },
    lastWeek: { start: lastWeekStart, end: lastWeekEnd },
    thisMonth: { start: thisMonthStart, end: thisMonthEnd },
    lastMonth: { start: lastMonthStart, end: lastMonthEnd },
    last7Days: { start: last7DaysStart, end: last7DaysEnd },
    last30Days: { start: last30DaysStart, end: last30DaysEnd },
  };
}
