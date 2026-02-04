import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatPaymentType,
  calculatePercentageChange,
  formatPercentageChange,
  getUserInitials,
  cn,
} from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats positive amounts correctly", () => {
    expect(formatCurrency(10.5)).toBe("$10.50");
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
    expect(formatCurrency(0.99)).toBe("$0.99");
  });

  it("formats negative amounts correctly", () => {
    expect(formatCurrency(-10.5)).toBe("-$10.50");
    expect(formatCurrency(-1234.56)).toBe("-$1,234.56");
  });

  it("formats zero correctly", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("handles large numbers", () => {
    expect(formatCurrency(1000000)).toBe("$1,000,000.00");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatCurrency(10.999)).toBe("$11.00");
    expect(formatCurrency(10.001)).toBe("$10.00");
  });
});

describe("formatPaymentType", () => {
  it("formats known payment types", () => {
    expect(formatPaymentType("cash")).toBe("Cash");
    expect(formatPaymentType("card")).toBe("Card");
    expect(formatPaymentType("google_pay")).toBe("Google Pay");
  });

  it("returns the original value for unknown types", () => {
    expect(formatPaymentType("apple_pay")).toBe("apple_pay");
    expect(formatPaymentType("unknown")).toBe("unknown");
  });
});

describe("calculatePercentageChange", () => {
  it("calculates positive change", () => {
    expect(calculatePercentageChange(150, 100)).toBe(50);
    expect(calculatePercentageChange(200, 100)).toBe(100);
  });

  it("calculates negative change", () => {
    expect(calculatePercentageChange(50, 100)).toBe(-50);
    expect(calculatePercentageChange(75, 100)).toBe(-25);
  });

  it("returns 0 when previous is 0", () => {
    expect(calculatePercentageChange(100, 0)).toBe(0);
  });

  it("returns 0 when no change", () => {
    expect(calculatePercentageChange(100, 100)).toBe(0);
  });
});

describe("formatPercentageChange", () => {
  it("formats positive changes with plus sign", () => {
    expect(formatPercentageChange(50)).toBe("+50.0%");
    expect(formatPercentageChange(25.5)).toBe("+25.5%");
  });

  it("formats negative changes without plus sign", () => {
    expect(formatPercentageChange(-50)).toBe("-50.0%");
    expect(formatPercentageChange(-25.5)).toBe("-25.5%");
  });

  it("formats zero as positive", () => {
    expect(formatPercentageChange(0)).toBe("+0.0%");
  });

  it("rounds to one decimal place", () => {
    expect(formatPercentageChange(33.333)).toBe("+33.3%");
    expect(formatPercentageChange(33.367)).toBe("+33.4%");
  });
});

describe("getUserInitials", () => {
  it("extracts initials from display name", () => {
    expect(getUserInitials("John Doe")).toBe("JD");
    expect(getUserInitials("Alice")).toBe("A");
    expect(getUserInitials("John Paul Smith")).toBe("JP"); // Only first 2
  });

  it("uses email when no display name", () => {
    expect(getUserInitials(null, "john@example.com")).toBe("JO");
    expect(getUserInitials(undefined, "alice@test.com")).toBe("AL");
  });

  it("returns U when no name or email", () => {
    expect(getUserInitials(null, null)).toBe("U");
    expect(getUserInitials(undefined, undefined)).toBe("U");
  });

  it("handles empty strings", () => {
    expect(getUserInitials("", "test@example.com")).toBe("TE");
  });
});

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
    expect(cn("foo", true && "bar", "baz")).toBe("foo bar baz");
  });

  it("merges tailwind classes correctly", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});
