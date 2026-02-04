import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  startAfter,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Sale } from "@/types";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "tenant_demo";

// Helper to parse timestamp from Firestore (can be Timestamp, number, or missing)
function parseTimestamp(ts: unknown): Date {
  if (ts instanceof Timestamp) {
    return ts.toDate();
  }
  if (typeof ts === "number") {
    return new Date(ts);
  }
  return new Date();
}

// Helper to convert doc data to Sale object with proper field mapping
function docToSale(docId: string, data: Record<string, unknown>): Sale {
  return {
    id: docId,
    receiptId: (data.receiptId as string) || "",
    productId: String(data.productId || ""),
    quantity: (data.quantity as number) || 0,
    timestamp: parseTimestamp(data.timestamp),
    paymentType: (data.paymentType as string) || "CASH",
    totalPrice: (data.totalPrice as number) || 0,
    totalPriceCents: Math.round(((data.totalPrice as number) || 0) * 100),
    discount: (data.discount as number) || 0,
    discountCents: Math.round(((data.discount as number) || 0) * 100),
    changeDue: (data.changeDue as number) || 0,
    changeDueCents: Math.round(((data.changeDue as number) || 0) * 100),
    gatewayTransactionId: data.gatewayTransactionId as string | undefined,
    tenantId: (data.tenant_id as string) || (data.tenantId as string) || TENANT_ID,
  };
}

export interface SaleFilters {
  startDate?: Date;
  endDate?: Date;
  paymentType?: string;
  receiptId?: string;
}

// Collection reference helper
function salesCollection() {
  return collection(db, `tenants/${TENANT_ID}/sales`);
}

// Fetch sales with filters
export async function fetchSales(filters?: SaleFilters): Promise<Sale[]> {
  let q = query(salesCollection(), orderBy("timestamp", "desc"));

  // Note: Android stores timestamp as milliseconds (Long), so we compare against numbers
  if (filters?.startDate) {
    q = query(q, where("timestamp", ">=", filters.startDate.getTime()));
  }

  if (filters?.endDate) {
    q = query(q, where("timestamp", "<=", filters.endDate.getTime()));
  }

  if (filters?.paymentType) {
    q = query(q, where("paymentType", "==", filters.paymentType));
  }

  const snapshot = await getDocs(q);
  let sales = snapshot.docs.map((doc) =>
    docToSale(doc.id, doc.data() as Record<string, unknown>)
  );

  // Client-side filter for receiptId search
  if (filters?.receiptId) {
    const search = filters.receiptId.toLowerCase();
    sales = sales.filter((s) => s.receiptId.toLowerCase().includes(search));
  }

  return sales;
}

// Fetch paginated sales
export async function fetchSalesPaginated(
  pageSize: number = 20,
  lastDoc?: QueryDocumentSnapshot,
  filters?: SaleFilters
): Promise<{ sales: Sale[]; lastVisible: QueryDocumentSnapshot | null; hasMore: boolean }> {
  let q = query(salesCollection(), orderBy("timestamp", "desc"), limit(pageSize));

  // Note: Android stores timestamp as milliseconds (Long), so we compare against numbers
  if (filters?.startDate) {
    q = query(q, where("timestamp", ">=", filters.startDate.getTime()));
  }

  if (filters?.endDate) {
    q = query(q, where("timestamp", "<=", filters.endDate.getTime()));
  }

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const sales = snapshot.docs.map((doc) =>
    docToSale(doc.id, doc.data() as Record<string, unknown>)
  );

  const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
  const hasMore = snapshot.docs.length === pageSize;

  return { sales, lastVisible, hasMore };
}

// Fetch single sale by ID
export async function fetchSale(id: string): Promise<Sale | null> {
  const docRef = doc(salesCollection(), id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;

  return docToSale(snapshot.id, snapshot.data() as Record<string, unknown>);
}

// Fetch sale by receipt ID
export async function fetchSaleByReceiptId(receiptId: string): Promise<Sale | null> {
  const q = query(salesCollection(), where("receiptId", "==", receiptId), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  return docToSale(docSnap.id, docSnap.data() as Record<string, unknown>);
}

// Get sales summary for date range
export async function getSalesSummary(startDate: Date, endDate: Date) {
  const sales = await fetchSales({ startDate, endDate });

  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalPrice, 0);
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  // Group by payment type
  const byPaymentType = sales.reduce(
    (acc, s) => {
      acc[s.paymentType] = (acc[s.paymentType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Group by day
  const byDay = sales.reduce(
    (acc, s) => {
      const day = s.timestamp.toISOString().split("T")[0];
      acc[day] = (acc[day] || 0) + s.totalPrice;
      return acc;
    },
    {} as Record<string, number>
  );

  const dailyRevenue = Object.entries(byDay)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalSales,
    totalRevenue,
    averageOrderValue,
    byPaymentType,
    dailyRevenue,
  };
}

// Get recent sales (for dashboard)
export async function getRecentSales(count: number = 5): Promise<Sale[]> {
  const q = query(salesCollection(), orderBy("timestamp", "desc"), limit(count));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) =>
    docToSale(doc.id, doc.data() as Record<string, unknown>)
  );
}

// Get today's sales summary
export async function getTodaysSummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getSalesSummary(today, tomorrow);
}
