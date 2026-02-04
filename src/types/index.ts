// Shared types matching the Android POS app data models

export interface Product {
  id: string;
  name: string;
  price: number;
  priceCents: number;
  stock: number;
  barcode?: string;
  category: string;
  stockAlertLevel: number;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Sale {
  id: string;
  receiptId: string;
  productId: string;
  quantity: number;
  timestamp: Date;
  paymentType: string;
  totalPrice: number;
  totalPriceCents: number;
  discount: number;
  discountCents: number;
  changeDue: number;
  changeDueCents: number;
  gatewayTransactionId?: string;
  tenantId: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  unitPriceCents: number;
}

export interface Return {
  id: string;
  originalSaleId: string;
  timestamp: Date;
  refundAmount: number;
  gatewayRefundId?: string;
  tenantId: string;
  items: ReturnLineItem[];
}

export interface ReturnLineItem {
  returnId: string;
  productId: string;
  quantity: number;
}

// Split settings architecture:
// - GlobalSettings: shared settings managed by backoffice, read by both platforms
// - AppSettings: mobile-only settings (printer, receipt sharing)
// - BackofficeSettings: web-only settings (future: dashboard preferences)

export interface GlobalSettings {
  // Business info (backoffice manages, app reads for receipts)
  businessName: string;
  businessAddress: string;
  businessWebsite: string;
  businessPhone: string;
  showBusinessInfo: boolean;
  // Default location for receipts (optional - if set, overrides business info on receipts)
  defaultLocationId?: string;
  // Tax settings
  taxEnabled: boolean;
  taxRate: string;
  // Currency & payments
  currencyCode: string;
  acceptedPaymentMethodIds: string[];
  // Inventory alerts
  stockLevelAlertsEnabled: boolean;
  // Google Pay configuration
  gpayMerchantName?: string;
  gpayMerchantId?: string;
  gpayGateway?: string;
  gpayGatewayMerchantId?: string;
  gpayEnvironment?: "TEST" | "PRODUCTION" | "";
  gpayGatewayParamsJson?: string;
  // WiPay configuration
  wipayPublicKey?: string;
  wipaySecretKey?: string;
}

export interface AppSettings {
  // Mobile-only settings
  printerEnabled: boolean;
  receiptSharingEnabled: boolean;
}

export interface BackofficeSettings {
  // Future: dashboard preferences, report defaults, etc.
  // Placeholder for now
  dashboardLayout?: string;
}

// Combined view for components that need all settings
export interface Settings extends GlobalSettings, AppSettings {}

// Default values
export const defaultGlobalSettings: GlobalSettings = {
  businessName: "",
  businessAddress: "",
  businessWebsite: "",
  businessPhone: "",
  showBusinessInfo: true,
  defaultLocationId: undefined,
  taxEnabled: false,
  taxRate: "0",
  currencyCode: "USD",
  acceptedPaymentMethodIds: ["cash", "card"],
  stockLevelAlertsEnabled: true,
  // Payment gateway defaults
  gpayMerchantName: "",
  gpayMerchantId: "",
  gpayGateway: "",
  gpayGatewayMerchantId: "",
  gpayEnvironment: "",
  gpayGatewayParamsJson: "",
  wipayPublicKey: "",
  wipaySecretKey: "",
};

export const defaultAppSettings: AppSettings = {
  printerEnabled: false,
  receiptSharingEnabled: true,
};

export const defaultBackofficeSettings: BackofficeSettings = {
  dashboardLayout: undefined,
};

export interface User {
  id: string;
  tenantId: string;
  locationIds: string[];
  email: string;
  displayName: string;
  role: 'admin' | 'manager' | 'cashier';
  permissions: string[];
  lastLogin?: Date;
  isActive: boolean;
}

export interface Location {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  timezone: string;
  currency: string;
  isActive: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
}

// Report types
export interface TopProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
}

export interface CategorySummary {
  category: string;
  totalSales: number;
  totalRevenue: number;
}

export interface SalesSummary {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: TopProduct[];
  dailyRevenue: DailyRevenue[];
  categorySummary: CategorySummary[];
  byPaymentType: Record<string, number>;
}
