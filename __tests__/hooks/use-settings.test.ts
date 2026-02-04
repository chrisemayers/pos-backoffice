import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  useSettings,
  useUpdateSettings,
  useUpdateBusinessInfo,
  useUpdateTaxSettings,
  useUpdatePaymentMethods,
  useUpdateReceiptSettings,
  useUpdateStockAlertSettings,
} from "@/hooks/use-settings";
import { createWrapper } from "../utils/test-utils";
import type { Settings } from "@/types";

// Mock the Firestore settings module
vi.mock("@/lib/firestore/settings", () => ({
  fetchSettings: vi.fn(),
  updateSettings: vi.fn(),
  updateBusinessInfo: vi.fn(),
  updateTaxSettings: vi.fn(),
  updatePaymentMethods: vi.fn(),
  updateReceiptSettings: vi.fn(),
  updateStockAlertSettings: vi.fn(),
}));

import {
  fetchSettings,
  updateSettings,
  updateBusinessInfo,
  updateTaxSettings,
  updatePaymentMethods,
  updateReceiptSettings,
  updateStockAlertSettings,
} from "@/lib/firestore/settings";

const mockSettings: Settings = {
  taxEnabled: true,
  taxRate: "15",
  businessName: "Test Store",
  businessAddress: "123 Main St",
  businessWebsite: "https://teststore.com",
  businessPhone: "555-1234",
  showBusinessInfo: true,
  receiptSharingEnabled: true,
  stockLevelAlertsEnabled: true,
  acceptedPaymentMethodIds: ["cash", "card"],
  printerEnabled: false,
  currencyCode: "USD",
};

describe("use-settings hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useSettings", () => {
    it("should fetch settings successfully", async () => {
      vi.mocked(fetchSettings).mockResolvedValue(mockSettings);

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockSettings);
      expect(fetchSettings).toHaveBeenCalled();
    });

    it("should handle fetch error", async () => {
      vi.mocked(fetchSettings).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe("useUpdateSettings", () => {
    it("should update settings", async () => {
      vi.mocked(updateSettings).mockResolvedValue(undefined);

      const { result } = renderHook(() => useUpdateSettings(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ taxEnabled: false, taxRate: "10" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(updateSettings).toHaveBeenCalled();
      const call = vi.mocked(updateSettings).mock.calls[0][0];
      expect(call).toEqual({ taxEnabled: false, taxRate: "10" });
    });
  });

  describe("useUpdateBusinessInfo", () => {
    it("should update business info with optimistic update", async () => {
      vi.mocked(updateBusinessInfo).mockResolvedValue(undefined);

      const { result } = renderHook(() => useUpdateBusinessInfo(), {
        wrapper: createWrapper(),
      });

      const businessInfo = {
        businessName: "New Store Name",
        businessAddress: "456 Oak Ave",
        businessWebsite: "https://newstore.com",
        businessPhone: "555-9876",
        showBusinessInfo: true,
      };

      result.current.mutate(businessInfo);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(updateBusinessInfo).toHaveBeenCalled();
      const call = vi.mocked(updateBusinessInfo).mock.calls[0][0];
      expect(call).toEqual(businessInfo);
    });

    it("should handle update error", async () => {
      vi.mocked(updateBusinessInfo).mockRejectedValue(
        new Error("Update failed")
      );

      const { result } = renderHook(() => useUpdateBusinessInfo(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        businessName: "Test",
        businessAddress: "",
        businessWebsite: "",
        businessPhone: "",
        showBusinessInfo: true,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe("useUpdateTaxSettings", () => {
    it("should update tax settings", async () => {
      vi.mocked(updateTaxSettings).mockResolvedValue(undefined);

      const { result } = renderHook(() => useUpdateTaxSettings(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ taxEnabled: true, taxRate: "12.5" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(updateTaxSettings).toHaveBeenCalled();
      const call = vi.mocked(updateTaxSettings).mock.calls[0][0];
      expect(call).toEqual({ taxEnabled: true, taxRate: "12.5" });
    });
  });

  describe("useUpdatePaymentMethods", () => {
    it("should update payment methods", async () => {
      vi.mocked(updatePaymentMethods).mockResolvedValue(undefined);

      const { result } = renderHook(() => useUpdatePaymentMethods(), {
        wrapper: createWrapper(),
      });

      const methods = ["cash", "card", "mobile"];
      result.current.mutate(methods);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(updatePaymentMethods).toHaveBeenCalled();
      const call = vi.mocked(updatePaymentMethods).mock.calls[0][0];
      expect(call).toEqual(methods);
    });
  });

  describe("useUpdateReceiptSettings", () => {
    it("should update receipt settings", async () => {
      vi.mocked(updateReceiptSettings).mockResolvedValue(undefined);

      const { result } = renderHook(() => useUpdateReceiptSettings(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        receiptSharingEnabled: false,
        printerEnabled: true,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(updateReceiptSettings).toHaveBeenCalled();
      const call = vi.mocked(updateReceiptSettings).mock.calls[0][0];
      expect(call).toEqual({
        receiptSharingEnabled: false,
        printerEnabled: true,
      });
    });
  });

  describe("useUpdateStockAlertSettings", () => {
    it("should update stock alert settings", async () => {
      vi.mocked(updateStockAlertSettings).mockResolvedValue(undefined);

      const { result } = renderHook(() => useUpdateStockAlertSettings(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(false);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(updateStockAlertSettings).toHaveBeenCalled();
      const call = vi.mocked(updateStockAlertSettings).mock.calls[0][0];
      expect(call).toBe(false);
    });
  });
});
