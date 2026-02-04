import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchSettings,
  fetchGlobalSettings,
  fetchAppSettings,
  updateSettings,
  updateGlobalSettings,
  updateBusinessInfo,
  updateTaxSettings,
  updatePaymentMethods,
  updateReceiptSettings,
  updateStockAlertSettings,
} from "@/lib/firestore/settings";
import {
  defaultGlobalSettings,
  defaultAppSettings,
  type GlobalSettings,
  type AppSettings,
  type Settings,
} from "@/types";

// Mock Firebase Firestore
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

import { getDoc, setDoc, updateDoc } from "firebase/firestore";

const customGlobalSettings: GlobalSettings = {
  taxEnabled: true,
  taxRate: "15",
  businessName: "Test Store",
  businessAddress: "123 Main St",
  businessWebsite: "https://teststore.com",
  businessPhone: "555-1234",
  showBusinessInfo: true,
  stockLevelAlertsEnabled: true,
  acceptedPaymentMethodIds: ["cash", "card", "mobile"],
  currencyCode: "TTD",
  gpayMerchantName: "",
  gpayMerchantId: "",
  gpayGateway: "",
  gpayGatewayMerchantId: "",
  gpayEnvironment: "",
  gpayGatewayParamsJson: "",
  wipayPublicKey: "",
  wipaySecretKey: "",
};

const customAppSettings: AppSettings = {
  printerEnabled: true,
  receiptSharingEnabled: false,
};

describe("Firestore Settings Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchGlobalSettings", () => {
    it("should return existing global settings when document exists", async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => customGlobalSettings,
      } as any);

      const result = await fetchGlobalSettings();

      expect(result).toMatchObject(customGlobalSettings);
      expect(setDoc).not.toHaveBeenCalled();
    });

    it("should create and return default global settings when document does not exist", async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await fetchGlobalSettings();

      expect(setDoc).toHaveBeenCalled();
      expect(result).toEqual(defaultGlobalSettings);
    });
  });

  describe("fetchAppSettings", () => {
    it("should return existing app settings when document exists", async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => customAppSettings,
      } as any);

      const result = await fetchAppSettings();

      expect(result).toMatchObject(customAppSettings);
    });

    it("should return default app settings when document does not exist", async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await fetchAppSettings();

      // App settings don't auto-create, just return defaults
      expect(result).toEqual(defaultAppSettings);
    });
  });

  describe("fetchSettings (combined)", () => {
    it("should combine global and app settings", async () => {
      // First call for global, second for app
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => customGlobalSettings,
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => customAppSettings,
        } as any);

      const result = await fetchSettings();

      // Should have properties from both
      expect(result.businessName).toBe("Test Store");
      expect(result.taxEnabled).toBe(true);
      expect(result.printerEnabled).toBe(true);
      expect(result.receiptSharingEnabled).toBe(false);
    });
  });

  describe("updateGlobalSettings", () => {
    it("should update existing global settings", async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await updateGlobalSettings({ taxEnabled: true, taxRate: "10" });

      expect(updateDoc).toHaveBeenCalled();
      expect(setDoc).not.toHaveBeenCalled();
    });

    it("should create global settings with defaults when document does not exist", async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      await updateGlobalSettings({ taxEnabled: true });

      expect(setDoc).toHaveBeenCalled();
      const setCall = vi.mocked(setDoc).mock.calls[0][1];
      expect(setCall).toMatchObject({
        ...defaultGlobalSettings,
        taxEnabled: true,
      });
    });
  });

  describe("updateSettings (combined)", () => {
    it("should route global settings to updateGlobalSettings", async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await updateSettings({ taxEnabled: true, businessName: "New Name" });

      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe("updateBusinessInfo", () => {
    it("should update business information fields", async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const businessInfo = {
        businessName: "New Store Name",
        businessAddress: "456 Oak Ave",
        businessWebsite: "https://newstore.com",
        businessPhone: "555-9876",
        showBusinessInfo: true,
      };

      await updateBusinessInfo(businessInfo);

      expect(updateDoc).toHaveBeenCalled();
      const updateCall = vi.mocked(updateDoc).mock.calls[0][1];
      expect(updateCall).toEqual(businessInfo);
    });
  });

  describe("updateTaxSettings", () => {
    it("should update tax configuration", async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await updateTaxSettings({ taxEnabled: true, taxRate: "12.5" });

      expect(updateDoc).toHaveBeenCalled();
      const updateCall = vi.mocked(updateDoc).mock.calls[0][1];
      expect(updateCall).toEqual({ taxEnabled: true, taxRate: "12.5" });
    });
  });

  describe("updatePaymentMethods", () => {
    it("should update accepted payment methods", async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await updatePaymentMethods(["cash", "card", "mobile", "crypto"]);

      expect(updateDoc).toHaveBeenCalled();
      const updateCall = vi.mocked(updateDoc).mock.calls[0][1];
      expect(updateCall.acceptedPaymentMethodIds).toEqual([
        "cash",
        "card",
        "mobile",
        "crypto",
      ]);
    });
  });

  describe("updateReceiptSettings", () => {
    it("should log a warning since receipt settings are managed by mobile app", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      await updateReceiptSettings({
        receiptSharingEnabled: false,
        printerEnabled: true,
      });

      // Receipt settings are now app-only, so this should just warn
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Receipt/printer settings are managed by the mobile app")
      );

      consoleSpy.mockRestore();
    });
  });

  describe("updateStockAlertSettings", () => {
    it("should update stock alert setting", async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await updateStockAlertSettings(false);

      expect(updateDoc).toHaveBeenCalled();
      const updateCall = vi.mocked(updateDoc).mock.calls[0][1];
      expect(updateCall.stockLevelAlertsEnabled).toBe(false);
    });
  });
});
