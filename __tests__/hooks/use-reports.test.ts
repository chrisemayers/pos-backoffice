import { describe, it, expect } from "vitest";
import { useDateRanges } from "@/hooks/use-reports";
import { renderHook } from "@testing-library/react";

describe("useDateRanges", () => {
  it("returns valid date ranges", () => {
    const { result } = renderHook(() => useDateRanges());

    // Check that all expected ranges exist
    expect(result.current.today).toBeDefined();
    expect(result.current.thisWeek).toBeDefined();
    expect(result.current.lastWeek).toBeDefined();
    expect(result.current.thisMonth).toBeDefined();
    expect(result.current.lastMonth).toBeDefined();
    expect(result.current.last7Days).toBeDefined();
    expect(result.current.last30Days).toBeDefined();
  });

  it("today range starts at midnight", () => {
    const { result } = renderHook(() => useDateRanges());

    const { start } = result.current.today;
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
  });

  it("today range ends at next midnight", () => {
    const { result } = renderHook(() => useDateRanges());

    const { start, end } = result.current.today;
    const diff = end.getTime() - start.getTime();
    expect(diff).toBe(24 * 60 * 60 * 1000); // 24 hours in ms
  });

  it("this week starts on Monday", () => {
    const { result } = renderHook(() => useDateRanges());

    const { start } = result.current.thisWeek;
    // Monday is day 1
    expect(start.getDay()).toBe(1);
  });

  it("this week is 7 days", () => {
    const { result } = renderHook(() => useDateRanges());

    const { start, end } = result.current.thisWeek;
    const diff = end.getTime() - start.getTime();
    expect(diff).toBe(7 * 24 * 60 * 60 * 1000); // 7 days in ms
  });

  it("last week ends where this week starts", () => {
    const { result } = renderHook(() => useDateRanges());

    const { end: lastWeekEnd } = result.current.lastWeek;
    const { start: thisWeekStart } = result.current.thisWeek;

    expect(lastWeekEnd.getTime()).toBe(thisWeekStart.getTime());
  });

  it("this month starts on the 1st", () => {
    const { result } = renderHook(() => useDateRanges());

    const { start } = result.current.thisMonth;
    expect(start.getDate()).toBe(1);
    expect(start.getHours()).toBe(0);
  });

  it("last 7 days spans approximately 7-8 days", () => {
    const { result } = renderHook(() => useDateRanges());

    const { start, end } = result.current.last7Days;
    const diff = end.getTime() - start.getTime();
    const days = diff / (24 * 60 * 60 * 1000);
    // Includes partial day for today
    expect(days).toBeGreaterThanOrEqual(7);
    expect(days).toBeLessThanOrEqual(8);
  });

  it("last 30 days spans approximately 30-31 days", () => {
    const { result } = renderHook(() => useDateRanges());

    const { start, end } = result.current.last30Days;
    const diff = end.getTime() - start.getTime();
    const days = diff / (24 * 60 * 60 * 1000);
    // Includes partial day for today
    expect(days).toBeGreaterThanOrEqual(30);
    expect(days).toBeLessThanOrEqual(31);
  });

  it("all ranges have start before end", () => {
    const { result } = renderHook(() => useDateRanges());

    const ranges = [
      result.current.today,
      result.current.thisWeek,
      result.current.lastWeek,
      result.current.thisMonth,
      result.current.lastMonth,
      result.current.last7Days,
      result.current.last30Days,
    ];

    for (const range of ranges) {
      expect(range.start.getTime()).toBeLessThan(range.end.getTime());
    }
  });
});
