import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Return, ReturnLineItem } from "@/types";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "tenant_demo";

// Collection reference
function returnsCollection() {
  return collection(db, `tenants/${TENANT_ID}/returns`);
}

// Filters for returns query
export interface ReturnFilters {
  startDate?: Date;
  endDate?: Date;
  originalSaleId?: string;
}

// Fetch returns with optional filters
export async function fetchReturns(filters?: ReturnFilters): Promise<Return[]> {
  const constraints: any[] = [orderBy("timestamp", "desc")];

  // Add date filters if provided
  // Note: Android stores timestamp as milliseconds (Long), so we compare against numbers
  if (filters?.startDate) {
    constraints.push(where("timestamp", ">=", filters.startDate.getTime()));
  }
  if (filters?.endDate) {
    constraints.push(where("timestamp", "<=", filters.endDate.getTime()));
  }

  const q = query(returnsCollection(), ...constraints);
  const snapshot = await getDocs(q);

  let returns = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      originalSaleId: data.originalSaleId || "",
      timestamp:
        data.timestamp instanceof Timestamp
          ? data.timestamp.toDate()
          : new Date(data.timestamp),
      refundAmount: data.refundAmount || 0,
      gatewayRefundId: data.gatewayRefundId,
      tenantId: data.tenant_id || TENANT_ID,
      items: (data.items || []).map((item: any) => ({
        returnId: doc.id,
        productId: item.productId || "",
        quantity: item.quantity || 0,
      })),
    };
  });

  // Client-side filter for originalSaleId (Android stores as number, user searches with string)
  if (filters?.originalSaleId) {
    const search = filters.originalSaleId.toLowerCase();
    returns = returns.filter((r) =>
      String(r.originalSaleId).toLowerCase().includes(search)
    );
  }

  return returns;
}

// Fetch a single return by ID
export async function fetchReturn(id: string): Promise<Return | null> {
  const docRef = doc(db, `tenants/${TENANT_ID}/returns`, id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    id: snapshot.id,
    originalSaleId: data.originalSaleId || "",
    timestamp:
      data.timestamp instanceof Timestamp
        ? data.timestamp.toDate()
        : new Date(data.timestamp),
    refundAmount: data.refundAmount || 0,
    gatewayRefundId: data.gatewayRefundId,
    tenantId: data.tenant_id || TENANT_ID,
    items: (data.items || []).map((item: any) => ({
      returnId: snapshot.id,
      productId: item.productId || "",
      quantity: item.quantity || 0,
    })),
  };
}

// Fetch returns for a specific sale
export async function fetchReturnsForSale(saleId: string): Promise<Return[]> {
  return fetchReturns({ originalSaleId: saleId });
}

// Get recent returns (for dashboard)
export async function getRecentReturns(count: number = 5): Promise<Return[]> {
  const q = query(
    returnsCollection(),
    orderBy("timestamp", "desc"),
    firestoreLimit(count)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      originalSaleId: data.originalSaleId || "",
      timestamp:
        data.timestamp instanceof Timestamp
          ? data.timestamp.toDate()
          : new Date(data.timestamp),
      refundAmount: data.refundAmount || 0,
      gatewayRefundId: data.gatewayRefundId,
      tenantId: data.tenant_id || TENANT_ID,
      items: (data.items || []).map((item: any) => ({
        returnId: doc.id,
        productId: item.productId || "",
        quantity: item.quantity || 0,
      })),
    };
  });
}

// Get returns summary for a date range
export async function getReturnsSummary(
  startDate: Date,
  endDate: Date
): Promise<{
  totalReturns: number;
  totalRefunded: number;
  itemsReturned: number;
}> {
  const returns = await fetchReturns({ startDate, endDate });

  const totalRefunded = returns.reduce((sum, r) => sum + r.refundAmount, 0);
  const itemsReturned = returns.reduce(
    (sum, r) => sum + r.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  return {
    totalReturns: returns.length,
    totalRefunded,
    itemsReturned,
  };
}

// Get today's returns summary
export async function getTodaysReturnsSummary(): Promise<{
  totalReturns: number;
  totalRefunded: number;
  itemsReturned: number;
}> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  return getReturnsSummary(startOfDay, endOfDay);
}
