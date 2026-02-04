import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  COMMON_TIMEZONES,
  COMMON_CURRENCIES,
} from "../locations";

// Mock firebase/firestore
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(() => ({ id: "mock-doc-id" })),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
    fromDate: vi.fn((date: Date) => ({ toDate: () => date })),
  },
}));

describe("locations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("COMMON_TIMEZONES", () => {
    it("should contain expected timezone values", () => {
      expect(COMMON_TIMEZONES).toBeDefined();
      expect(Array.isArray(COMMON_TIMEZONES)).toBe(true);
      expect(COMMON_TIMEZONES.length).toBeGreaterThan(0);
    });

    it("should have required properties for each timezone", () => {
      COMMON_TIMEZONES.forEach((tz) => {
        expect(tz).toHaveProperty("value");
        expect(tz).toHaveProperty("label");
        expect(typeof tz.value).toBe("string");
        expect(typeof tz.label).toBe("string");
      });
    });

    it("should include common US timezones", () => {
      const values = COMMON_TIMEZONES.map((tz) => tz.value);
      expect(values).toContain("America/New_York");
      expect(values).toContain("America/Chicago");
      expect(values).toContain("America/Denver");
      expect(values).toContain("America/Los_Angeles");
    });

    it("should include Caribbean timezones", () => {
      const values = COMMON_TIMEZONES.map((tz) => tz.value);
      expect(values).toContain("America/Port_of_Spain");
      expect(values).toContain("America/Jamaica");
    });
  });

  describe("COMMON_CURRENCIES", () => {
    it("should contain expected currency values", () => {
      expect(COMMON_CURRENCIES).toBeDefined();
      expect(Array.isArray(COMMON_CURRENCIES)).toBe(true);
      expect(COMMON_CURRENCIES.length).toBeGreaterThan(0);
    });

    it("should have required properties for each currency", () => {
      COMMON_CURRENCIES.forEach((currency) => {
        expect(currency).toHaveProperty("value");
        expect(currency).toHaveProperty("label");
        expect(currency).toHaveProperty("symbol");
        expect(typeof currency.value).toBe("string");
        expect(typeof currency.label).toBe("string");
        expect(typeof currency.symbol).toBe("string");
      });
    });

    it("should include major currencies", () => {
      const values = COMMON_CURRENCIES.map((c) => c.value);
      expect(values).toContain("USD");
      expect(values).toContain("EUR");
      expect(values).toContain("GBP");
    });

    it("should include Caribbean currencies", () => {
      const values = COMMON_CURRENCIES.map((c) => c.value);
      expect(values).toContain("TTD");
      expect(values).toContain("JMD");
      expect(values).toContain("BBD");
      expect(values).toContain("XCD");
    });

    it("should have correct symbols for common currencies", () => {
      const usd = COMMON_CURRENCIES.find((c) => c.value === "USD");
      const eur = COMMON_CURRENCIES.find((c) => c.value === "EUR");
      const gbp = COMMON_CURRENCIES.find((c) => c.value === "GBP");

      expect(usd?.symbol).toBe("$");
      expect(eur?.symbol).toBe("€");
      expect(gbp?.symbol).toBe("£");
    });
  });
});
