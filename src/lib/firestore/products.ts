import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product } from "@/types";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "tenant_demo";

export interface ProductFilters {
  search?: string;
  category?: string;
  lowStock?: boolean;
  includeDeleted?: boolean;
}

export type CreateProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;
export type UpdateProductInput = Partial<CreateProductInput> & { id: string };

// Collection reference helper
function productsCollection() {
  return collection(db, `tenants/${TENANT_ID}/products`);
}

// Fetch all products with optional filters
export async function fetchProducts(filters?: ProductFilters): Promise<Product[]> {
  try {
    // Start with base query - filter by isDeleted first, then order
    // This order is required for composite indexes in Firestore
    let q;

    if (!filters?.includeDeleted) {
      if (filters?.category && filters.category !== "All") {
        // Query with both isDeleted and category filters
        q = query(
          productsCollection(),
          where("isDeleted", "==", false),
          where("category", "==", filters.category),
          orderBy("name")
        );
      } else {
        // Query with just isDeleted filter
        q = query(
          productsCollection(),
          where("isDeleted", "==", false),
          orderBy("name")
        );
      }
    } else {
      // Include all products (including deleted)
      q = query(productsCollection(), orderBy("name"));
    }

    const snapshot = await getDocs(q);
    console.log(`[Firestore] Fetched ${snapshot.docs.length} products from tenants/${TENANT_ID}/products`);

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    })) as Product[];

    // Client-side filtering for search and low stock
    let filtered = products;

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.barcode?.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search)
      );
    }

    if (filters?.lowStock) {
      filtered = filtered.filter((p) => p.stock <= (p.stockAlertLevel || 10));
    }

    return filtered;
  } catch (error) {
    console.error(`[Firestore] Error fetching products from tenants/${TENANT_ID}/products:`, error);
    throw error;
  }
}

// Fetch single product
export async function fetchProduct(id: string): Promise<Product | null> {
  const docRef = doc(productsCollection(), id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
    createdAt: snapshot.data().createdAt?.toDate?.() || new Date(),
    updatedAt: snapshot.data().updatedAt?.toDate?.() || new Date(),
  } as Product;
}

// Generate next available numeric product ID (compatible with Android app)
async function getNextProductId(): Promise<number> {
  const snapshot = await getDocs(productsCollection());
  let maxId = 0;
  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    // Check both the id field and try to parse doc.id as number
    const idFromField = typeof data.id === "number" ? data.id : 0;
    const idFromDoc = parseInt(docSnap.id, 10) || 0;
    maxId = Math.max(maxId, idFromField, idFromDoc);
  });
  return maxId + 1;
}

// Create product
export async function createProduct(input: CreateProductInput): Promise<Product> {
  // Generate a numeric ID compatible with Android app
  const numericId = await getNextProductId();

  // Explicitly ensure isDeleted is set to false for new products
  const productData = {
    ...input,
    id: numericId, // Store numeric ID in document (Android expects this)
    isDeleted: input.isDeleted ?? false,
    priceCents: Math.round(input.price * 100),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    tenant_id: TENANT_ID, // Android also stores this
  };

  console.log(`[Firestore] Creating product in tenants/${TENANT_ID}/products:`, productData.name, `(id=${numericId})`);

  // Use the numeric ID as document ID for consistency with Android
  const docRef = doc(productsCollection(), String(numericId));
  await setDoc(docRef, productData);

  console.log(`[Firestore] Product created with ID: ${numericId}`);

  return {
    id: String(numericId),
    ...input,
    isDeleted: productData.isDeleted,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Update product
export async function updateProduct(input: UpdateProductInput): Promise<void> {
  const { id, ...data } = input;
  const docRef = doc(productsCollection(), id);

  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: Timestamp.now(),
  };

  if (data.price !== undefined) {
    updateData.priceCents = Math.round(data.price * 100);
  }

  await updateDoc(docRef, updateData);
}

// Soft delete product
export async function deleteProduct(id: string): Promise<void> {
  const docRef = doc(productsCollection(), id);
  await updateDoc(docRef, {
    isDeleted: true,
    updatedAt: Timestamp.now(),
  });
}

// Restore product
export async function restoreProduct(id: string): Promise<void> {
  const docRef = doc(productsCollection(), id);
  await updateDoc(docRef, {
    isDeleted: false,
    updatedAt: Timestamp.now(),
  });
}

// Fetch categories (distinct values)
export async function fetchCategories(): Promise<string[]> {
  const products = await fetchProducts({ includeDeleted: false });
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
  return categories.sort();
}

// Bulk update stock
export async function updateStock(
  updates: Array<{ id: string; stock: number }>
): Promise<void> {
  const promises = updates.map(({ id, stock }) => {
    const docRef = doc(productsCollection(), id);
    return updateDoc(docRef, {
      stock,
      updatedAt: Timestamp.now(),
    });
  });

  await Promise.all(promises);
}
