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

export interface Settings {
  taxEnabled: boolean;
  taxRate: string;
  businessName: string;
  businessAddress: string;
  businessWebsite: string;
  businessPhone: string;
  showBusinessInfo: boolean;
  receiptSharingEnabled: boolean;
  stockLevelAlertsEnabled: boolean;
  acceptedPaymentMethodIds: string[];
  printerEnabled: boolean;
  currencyCode: string;
}

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
}
