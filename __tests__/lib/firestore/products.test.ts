import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchProducts,
  fetchProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  fetchCategories,
  updateStock,
} from "@/lib/firestore/products";
import type { Product } from "@/types";

// Mock Firebase Firestore
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(() => ({ id: "mock-doc" })),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  Timestamp: {
    now: () => ({ toDate: () => new Date() }),
  },
}));

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

// Import mocked functions
import { getDocs, getDoc, addDoc, setDoc, updateDoc } from "firebase/firestore";

const mockProduct: Product = {
  id: "prod-1",
  name: "Test Product",
  price: 9.99,
  priceCents: 999,
  stock: 100,
  category: "Electronics",
  barcode: "123456789",
  stockAlertLevel: 10,
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockProducts: Product[] = [
  mockProduct,
  {
    ...mockProduct,
    id: "prod-2",
    name: "Another Product",
    price: 19.99,
    priceCents: 1999,
    stock: 5,
    category: "Clothing",
    barcode: "987654321",
  },
  {
    ...mockProduct,
    id: "prod-3",
    name: "Low Stock Item",
    price: 4.99,
    priceCents: 499,
    stock: 2,
    stockAlertLevel: 10,
    category: "Electronics",
  },
];

describe("Firestore Products Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchProducts", () => {
    it("should fetch all products without filters", async () => {
      const mockDocs = mockProducts.map((p) => ({
        id: p.id,
        data: () => ({
          ...p,
          createdAt: { toDate: () => p.createdAt },
          updatedAt: { toDate: () => p.updatedAt },
        }),
      }));

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockDocs,
      } as any);

      const result = await fetchProducts();

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe("Test Product");
    });

    it("should filter products by search term", async () => {
      const mockDocs = mockProducts.map((p) => ({
        id: p.id,
        data: () => ({
          ...p,
          createdAt: { toDate: () => p.createdAt },
          updatedAt: { toDate: () => p.updatedAt },
        }),
      }));

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockDocs,
      } as any);

      const result = await fetchProducts({ search: "Another" });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Another Product");
    });

    it("should filter products by barcode search", async () => {
      const mockDocs = mockProducts.map((p) => ({
        id: p.id,
        data: () => ({
          ...p,
          createdAt: { toDate: () => p.createdAt },
          updatedAt: { toDate: () => p.updatedAt },
        }),
      }));

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockDocs,
      } as any);

      const result = await fetchProducts({ search: "987654321" });

      expect(result).toHaveLength(1);
      expect(result[0].barcode).toBe("987654321");
    });

    it("should filter low stock products", async () => {
      const mockDocs = mockProducts.map((p) => ({
        id: p.id,
        data: () => ({
          ...p,
          createdAt: { toDate: () => p.createdAt },
          updatedAt: { toDate: () => p.updatedAt },
        }),
      }));

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockDocs,
      } as any);

      const result = await fetchProducts({ lowStock: true });

      // Products with stock <= stockAlertLevel
      expect(result.length).toBeGreaterThanOrEqual(1);
      result.forEach((p) => {
        expect(p.stock).toBeLessThanOrEqual(p.stockAlertLevel || 10);
      });
    });

    it("should handle fetch errors gracefully", async () => {
      vi.mocked(getDocs).mockRejectedValue(new Error("Network error"));

      await expect(fetchProducts()).rejects.toThrow("Network error");
    });
  });

  describe("fetchProduct", () => {
    it("should fetch a single product by ID", async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: mockProduct.id,
        data: () => ({
          ...mockProduct,
          createdAt: { toDate: () => mockProduct.createdAt },
          updatedAt: { toDate: () => mockProduct.updatedAt },
        }),
      } as any);

      const result = await fetchProduct("prod-1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("prod-1");
      expect(result?.name).toBe("Test Product");
    });

    it("should return null for non-existent product", async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await fetchProduct("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("createProduct", () => {
    it("should create a new product", async () => {
      const newProduct = {
        name: "New Product",
        price: 15.99,
        priceCents: 1599,
        stock: 50,
        category: "Food",
        barcode: "111222333",
        stockAlertLevel: 5,
        isDeleted: false,
      };

      // Mock getDocs for getNextProductId
      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
      } as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await createProduct(newProduct);

      expect(setDoc).toHaveBeenCalled();
      expect(result.id).toBe("1"); // First product gets ID 1
      expect(result.name).toBe("New Product");
      expect(result.isDeleted).toBe(false);
    });

    it("should set isDeleted to false by default", async () => {
      const newProduct = {
        name: "New Product",
        price: 15.99,
        priceCents: 1599,
        stock: 50,
        category: "Food",
        barcode: "111222333",
        stockAlertLevel: 5,
      };

      // Mock getDocs for getNextProductId
      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
      } as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await createProduct(newProduct as any);

      expect(result.isDeleted).toBe(false);
    });
  });

  describe("updateProduct", () => {
    it("should update product fields", async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await updateProduct({
        id: "prod-1",
        name: "Updated Name",
        price: 29.99,
      });

      expect(updateDoc).toHaveBeenCalled();
      const updateCall = vi.mocked(updateDoc).mock.calls[0][1];
      expect(updateCall).toMatchObject({
        name: "Updated Name",
        price: 29.99,
        priceCents: 2999,
      });
    });

    it("should convert price to cents when updating", async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await updateProduct({
        id: "prod-1",
        price: 12.50,
      });

      const updateCall = vi.mocked(updateDoc).mock.calls[0][1];
      expect(updateCall.priceCents).toBe(1250);
    });
  });

  describe("deleteProduct", () => {
    it("should soft delete a product", async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await deleteProduct("prod-1");

      expect(updateDoc).toHaveBeenCalled();
      const updateCall = vi.mocked(updateDoc).mock.calls[0][1];
      expect(updateCall.isDeleted).toBe(true);
    });
  });

  describe("restoreProduct", () => {
    it("should restore a soft-deleted product", async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await restoreProduct("prod-1");

      expect(updateDoc).toHaveBeenCalled();
      const updateCall = vi.mocked(updateDoc).mock.calls[0][1];
      expect(updateCall.isDeleted).toBe(false);
    });
  });

  describe("fetchCategories", () => {
    it("should return unique sorted categories", async () => {
      const mockDocs = mockProducts.map((p) => ({
        id: p.id,
        data: () => ({
          ...p,
          createdAt: { toDate: () => p.createdAt },
          updatedAt: { toDate: () => p.updatedAt },
        }),
      }));

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockDocs,
      } as any);

      const result = await fetchCategories();

      expect(result).toContain("Electronics");
      expect(result).toContain("Clothing");
      // Should be sorted and unique
      expect(result).toEqual([...new Set(result)].sort());
    });
  });

  describe("updateStock", () => {
    it("should update stock for multiple products", async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const updates = [
        { id: "prod-1", stock: 150 },
        { id: "prod-2", stock: 75 },
      ];

      await updateStock(updates);

      expect(updateDoc).toHaveBeenCalledTimes(2);
    });
  });
});
