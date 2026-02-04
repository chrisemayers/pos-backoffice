import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Sale, TopProduct, CategorySummary, SalesSummary } from "@/types";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "tenant_demo";

function salesCollection() {
  return collection(db, `tenants/${TENANT_ID}/sales`);
}

function productsCollection() {
  return collection(db, `tenants/${TENANT_ID}/products`);
}

// Get comprehensive sales report for a date range
export async function getSalesReport(
  startDate: Date,
  endDate: Date
): Promise<SalesSummary> {
  // Fetch sales in date range
  // Note: Android stores timestamp as milliseconds (Long), so we compare against numbers
  const salesQuery = query(
    salesCollection(),
    where("timestamp", ">=", startDate.getTime()),
    where("timestamp", "<=", endDate.getTime()),
    orderBy("timestamp", "desc")
  );

  const salesSnapshot = await getDocs(salesQuery);
  const sales = salesSnapshot.docs.map((doc) => {
    const data = doc.data();
    const ts = data.timestamp;
    // Handle timestamp: could be Firestore Timestamp, number (ms from Android), or missing
    const timestamp = ts instanceof Timestamp
      ? ts.toDate()
      : typeof ts === "number"
        ? new Date(ts)
        : new Date();
    return {
      id: doc.id,
      ...data,
      timestamp,
    };
  }) as Sale[];

  // Fetch products for names - index by both doc.id and the "id" field (for Android compatibility)
  const productsSnapshot = await getDocs(productsCollection());
  const productsMap = new Map<string, string>();
  productsSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    // Index by document ID
    productsMap.set(doc.id, data.name);
    // Also index by the numeric "id" field (Android stores productId as number in sales)
    if (data.id !== undefined) {
      productsMap.set(String(data.id), data.name);
    }
  });

  // Calculate totals
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalPrice, 0);
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  // Group by product for top products
  const productSales = new Map<string, { quantity: number; revenue: number }>();
  sales.forEach((sale) => {
    // Convert productId to string for consistent map keys
    const productIdStr = String(sale.productId);
    const existing = productSales.get(productIdStr) || { quantity: 0, revenue: 0 };
    productSales.set(productIdStr, {
      quantity: existing.quantity + sale.quantity,
      revenue: existing.revenue + sale.totalPrice,
    });
  });

  const topProducts: TopProduct[] = Array.from(productSales.entries())
    .map(([productId, data]) => ({
      productId,
      productName: productsMap.get(productId) || productsMap.get(String(productId)) || "Unknown Product",
      totalQuantity: data.quantity,
      totalRevenue: data.revenue,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);

  // Group by day
  const byDay = new Map<string, number>();
  sales.forEach((sale) => {
    const day = sale.timestamp.toISOString().split("T")[0];
    byDay.set(day, (byDay.get(day) || 0) + sale.totalPrice);
  });

  const dailyRevenue = Array.from(byDay.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Group by category (would need product category data)
  // For now, return empty - would need to join with products
  const categorySummary: CategorySummary[] = [];

  // Group by payment type
  const byPaymentType = sales.reduce(
    (acc, s) => {
      acc[s.paymentType] = (acc[s.paymentType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalSales,
    totalRevenue,
    averageOrderValue,
    topProducts,
    dailyRevenue,
    categorySummary,
    byPaymentType,
  };
}

// Compare two periods (e.g., this week vs last week)
export async function getComparisonReport(
  currentStart: Date,
  currentEnd: Date,
  previousStart: Date,
  previousEnd: Date
) {
  const [current, previous] = await Promise.all([
    getSalesReport(currentStart, currentEnd),
    getSalesReport(previousStart, previousEnd),
  ]);

  const revenueChange =
    previous.totalRevenue > 0
      ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100
      : 0;

  const salesChange =
    previous.totalSales > 0
      ? ((current.totalSales - previous.totalSales) / previous.totalSales) * 100
      : 0;

  const aovChange =
    previous.averageOrderValue > 0
      ? ((current.averageOrderValue - previous.averageOrderValue) /
          previous.averageOrderValue) *
        100
      : 0;

  return {
    current,
    previous,
    changes: {
      revenue: revenueChange,
      sales: salesChange,
      averageOrderValue: aovChange,
    },
  };
}
