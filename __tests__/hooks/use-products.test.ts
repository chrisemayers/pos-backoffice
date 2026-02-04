import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  useProducts,
  useProduct,
  useCategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useRestoreProduct,
  useUpdateStock,
} from "@/hooks/use-products";
import { createWrapper } from "../utils/test-utils";
import type { Product } from "@/types";

// Mock the Firestore products module
vi.mock("@/lib/firestore/products", () => ({
  fetchProducts: vi.fn(),
  fetchProduct: vi.fn(),
  fetchCategories: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  restoreProduct: vi.fn(),
  updateStock: vi.fn(),
}));

import {
  fetchProducts,
  fetchProduct,
  fetchCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  updateStock,
} from "@/lib/firestore/products";

const mockProduct: Product = {
  id: "prod-1",
  name: "Test Product",
  price: 9.99,
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
  { ...mockProduct, id: "prod-2", name: "Product 2" },
];

describe("use-products hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useProducts", () => {
    it("should fetch products successfully", async () => {
      vi.mocked(fetchProducts).mockResolvedValue(mockProducts);

      const { result } = renderHook(() => useProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockProducts);
      expect(fetchProducts).toHaveBeenCalledWith(undefined);
    });

    it("should fetch products with filters", async () => {
      vi.mocked(fetchProducts).mockResolvedValue([mockProduct]);

      const filters = { search: "Test", category: "Electronics" };
      const { result } = renderHook(() => useProducts(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(fetchProducts).toHaveBeenCalledWith(filters);
    });

    it("should handle fetch error", async () => {
      vi.mocked(fetchProducts).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe("useProduct", () => {
    it("should fetch single product by ID", async () => {
      vi.mocked(fetchProduct).mockResolvedValue(mockProduct);

      const { result } = renderHook(() => useProduct("prod-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockProduct);
      expect(fetchProduct).toHaveBeenCalledWith("prod-1");
    });

    it("should not fetch when ID is empty", async () => {
      const { result } = renderHook(() => useProduct(""), {
        wrapper: createWrapper(),
      });

      // Query should not be enabled
      expect(result.current.fetchStatus).toBe("idle");
      expect(fetchProduct).not.toHaveBeenCalled();
    });
  });

  describe("useCategories", () => {
    it("should fetch categories", async () => {
      vi.mocked(fetchCategories).mockResolvedValue(["Electronics", "Clothing"]);

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(["Electronics", "Clothing"]);
    });
  });

  describe("useCreateProduct", () => {
    it("should create a product", async () => {
      const newProduct = { ...mockProduct, id: "new-id" };
      vi.mocked(createProduct).mockResolvedValue(newProduct);

      const { result } = renderHook(() => useCreateProduct(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        name: "New Product",
        price: 15.99,
        stock: 50,
        category: "Food",
        barcode: "111222333",
        stockAlertLevel: 5,
        isDeleted: false,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(createProduct).toHaveBeenCalled();
    });
  });

  describe("useUpdateProduct", () => {
    it("should update a product", async () => {
      vi.mocked(updateProduct).mockResolvedValue(undefined);

      const { result } = renderHook(() => useUpdateProduct(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "prod-1",
        name: "Updated Name",
        price: 29.99,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(updateProduct).toHaveBeenCalledWith({
        id: "prod-1",
        name: "Updated Name",
        price: 29.99,
      });
    });
  });

  describe("useDeleteProduct", () => {
    it("should soft delete a product", async () => {
      vi.mocked(deleteProduct).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteProduct(), {
        wrapper: createWrapper(),
      });

      result.current.mutate("prod-1");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(deleteProduct).toHaveBeenCalledWith("prod-1");
    });
  });

  describe("useRestoreProduct", () => {
    it("should restore a deleted product", async () => {
      vi.mocked(restoreProduct).mockResolvedValue(undefined);

      const { result } = renderHook(() => useRestoreProduct(), {
        wrapper: createWrapper(),
      });

      result.current.mutate("prod-1");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(restoreProduct).toHaveBeenCalledWith("prod-1");
    });
  });

  describe("useUpdateStock", () => {
    it("should update stock for multiple products", async () => {
      vi.mocked(updateStock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useUpdateStock(), {
        wrapper: createWrapper(),
      });

      const updates = [
        { id: "prod-1", stock: 150 },
        { id: "prod-2", stock: 75 },
      ];

      result.current.mutate(updates);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(updateStock).toHaveBeenCalledWith(updates);
    });
  });
});
