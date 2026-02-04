import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  Settings,
  GlobalSettings,
  AppSettings,
  BackofficeSettings,
} from "@/types";
import {
  defaultGlobalSettings,
  defaultAppSettings,
  defaultBackofficeSettings,
} from "@/types";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "tenant_demo";

// Document references for split settings architecture
function globalSettingsDoc() {
  return doc(db, `tenants/${TENANT_ID}/settings/global`);
}

function appSettingsDoc() {
  return doc(db, `tenants/${TENANT_ID}/settings/app`);
}

function backofficeSettingsDoc() {
  return doc(db, `tenants/${TENANT_ID}/settings/backoffice`);
}

// ============ Global Settings (managed by backoffice, read by both) ============

export async function fetchGlobalSettings(): Promise<GlobalSettings> {
  try {
    console.log(
      `[Firestore] Fetching global settings from tenants/${TENANT_ID}/settings/global`
    );
    const snapshot = await getDoc(globalSettingsDoc());

    if (!snapshot.exists()) {
      console.log(
        "[Firestore] Global settings not found, creating defaults..."
      );
      try {
        await setDoc(globalSettingsDoc(), defaultGlobalSettings);
      } catch (createError) {
        console.warn(
          "[Firestore] Could not create default global settings:",
          createError
        );
      }
      return defaultGlobalSettings;
    }

    const data = snapshot.data();
    console.log("[Firestore] Global settings loaded successfully:", data);
    return { ...defaultGlobalSettings, ...data } as GlobalSettings;
  } catch (error) {
    console.error("[Firestore] Error fetching global settings:", error);
    return defaultGlobalSettings;
  }
}

export async function updateGlobalSettings(
  settings: Partial<GlobalSettings>
): Promise<void> {
  const docRef = globalSettingsDoc();
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    await setDoc(docRef, { ...defaultGlobalSettings, ...settings });
  } else {
    await updateDoc(docRef, settings);
  }
}

// ============ App Settings (mobile-only, read-only for backoffice) ============

export async function fetchAppSettings(): Promise<AppSettings> {
  try {
    console.log(
      `[Firestore] Fetching app settings from tenants/${TENANT_ID}/settings/app`
    );
    const snapshot = await getDoc(appSettingsDoc());

    if (!snapshot.exists()) {
      console.log("[Firestore] App settings not found, returning defaults");
      return defaultAppSettings;
    }

    const data = snapshot.data();
    console.log("[Firestore] App settings loaded successfully:", data);
    return { ...defaultAppSettings, ...data } as AppSettings;
  } catch (error) {
    console.error("[Firestore] Error fetching app settings:", error);
    return defaultAppSettings;
  }
}

// Note: App settings are managed by the mobile app, backoffice is read-only
// If needed in the future, add updateAppSettings here

// ============ Backoffice Settings (web-only) ============

export async function fetchBackofficeSettings(): Promise<BackofficeSettings> {
  try {
    console.log(
      `[Firestore] Fetching backoffice settings from tenants/${TENANT_ID}/settings/backoffice`
    );
    const snapshot = await getDoc(backofficeSettingsDoc());

    if (!snapshot.exists()) {
      console.log(
        "[Firestore] Backoffice settings not found, creating defaults..."
      );
      try {
        await setDoc(backofficeSettingsDoc(), defaultBackofficeSettings);
      } catch (createError) {
        console.warn(
          "[Firestore] Could not create default backoffice settings:",
          createError
        );
      }
      return defaultBackofficeSettings;
    }

    const data = snapshot.data();
    console.log("[Firestore] Backoffice settings loaded successfully:", data);
    return { ...defaultBackofficeSettings, ...data } as BackofficeSettings;
  } catch (error) {
    console.error("[Firestore] Error fetching backoffice settings:", error);
    return defaultBackofficeSettings;
  }
}

export async function updateBackofficeSettings(
  settings: Partial<BackofficeSettings>
): Promise<void> {
  const docRef = backofficeSettingsDoc();
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    await setDoc(docRef, { ...defaultBackofficeSettings, ...settings });
  } else {
    await updateDoc(docRef, settings);
  }
}

// ============ Combined Settings (for backward compatibility) ============

export async function fetchSettings(): Promise<Settings> {
  const [global, app] = await Promise.all([
    fetchGlobalSettings(),
    fetchAppSettings(),
  ]);

  return { ...global, ...app };
}

// Update settings - routes to appropriate document
export async function updateSettings(settings: Partial<Settings>): Promise<void> {
  const globalKeys: (keyof GlobalSettings)[] = [
    "businessName",
    "businessAddress",
    "businessWebsite",
    "businessPhone",
    "showBusinessInfo",
    "defaultLocationId",
    "taxEnabled",
    "taxRate",
    "currencyCode",
    "acceptedPaymentMethodIds",
    "stockLevelAlertsEnabled",
    // Payment gateway configs
    "gpayMerchantName",
    "gpayMerchantId",
    "gpayGateway",
    "gpayGatewayMerchantId",
    "gpayEnvironment",
    "gpayGatewayParamsJson",
    "wipayPublicKey",
    "wipaySecretKey",
  ];

  const globalUpdates: Partial<GlobalSettings> = {};

  for (const key of globalKeys) {
    if (key in settings) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalUpdates as any)[key] = (settings as any)[key];
    }
  }

  if (Object.keys(globalUpdates).length > 0) {
    await updateGlobalSettings(globalUpdates);
  }
}

// ============ Convenience functions for specific setting groups ============

export async function updateBusinessInfo(info: {
  businessName: string;
  businessAddress: string;
  businessWebsite: string;
  businessPhone: string;
  showBusinessInfo: boolean;
}): Promise<void> {
  await updateGlobalSettings(info);
}

export async function updateTaxSettings(tax: {
  taxEnabled: boolean;
  taxRate: string;
}): Promise<void> {
  await updateGlobalSettings(tax);
}

export async function updatePaymentMethods(
  acceptedPaymentMethodIds: string[]
): Promise<void> {
  await updateGlobalSettings({ acceptedPaymentMethodIds });
}

export async function updateReceiptSettings(receipt: {
  receiptSharingEnabled: boolean;
  printerEnabled: boolean;
}): Promise<void> {
  // These are app settings - backoffice can view but not edit
  // If editing is needed in the future, update appSettingsDoc
  console.warn(
    "[Settings] Receipt/printer settings are managed by the mobile app"
  );
}

export async function updateStockAlertSettings(
  stockLevelAlertsEnabled: boolean
): Promise<void> {
  await updateGlobalSettings({ stockLevelAlertsEnabled });
}

// ============ Payment Gateway Configuration ============

export interface GooglePayConfig {
  gpayMerchantName?: string;
  gpayMerchantId?: string;
  gpayGateway?: string;
  gpayGatewayMerchantId?: string;
  gpayEnvironment?: "TEST" | "PRODUCTION" | "";
  gpayGatewayParamsJson?: string;
}

export interface WiPayConfig {
  wipayPublicKey?: string;
  wipaySecretKey?: string;
}

export async function updateGooglePayConfig(config: GooglePayConfig): Promise<void> {
  await updateGlobalSettings(config);
}

export async function updateWiPayConfig(config: WiPayConfig): Promise<void> {
  await updateGlobalSettings(config);
}

// ============ Location Configuration ============

export async function updateDefaultLocation(
  locationId: string | null
): Promise<void> {
  await updateGlobalSettings({ defaultLocationId: locationId ?? undefined });
}
