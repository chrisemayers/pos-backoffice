import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductTable } from "@/components/inventory/product-table";
import type { Product } from "@/types";

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Test Product 1",
    price: 9.99,
    priceCents: 999,
    stock: 50,
    barcode: "123456789",
    category: "Electronics",
    stockAlertLevel: 10,
    isDeleted: false,
  },
  {
    id: "2",
    name: "Low Stock Item",
    price: 19.99,
    priceCents: 1999,
    stock: 5,
    barcode: "987654321",
    category: "Clothing",
    stockAlertLevel: 10,
    isDeleted: false,
  },
  {
    id: "3",
    name: "Archived Product",
    price: 29.99,
    priceCents: 2999,
    stock: 0,
    category: "Food",
    stockAlertLevel: 10,
    isDeleted: true,
  },
];

describe("ProductTable", () => {
  it("renders product data correctly", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <ProductTable
        products={[mockProducts[0]]}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("123456789")).toBeInTheDocument();
    expect(screen.getByText("$9.99")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("displays empty state when no products", () => {
    render(
      <ProductTable products={[]} onEdit={vi.fn()} onDelete={vi.fn()} />
    );

    expect(screen.getByText("No products found")).toBeInTheDocument();
  });

  it("displays archived empty state when showArchived is true", () => {
    render(
      <ProductTable
        products={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        showArchived
      />
    );

    expect(screen.getByText("No archived products")).toBeInTheDocument();
  });

  it("shows low stock warning indicator", () => {
    render(
      <ProductTable
        products={[mockProducts[1]]} // Low stock item
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Low stock item should show warning (stock 5 < alert level 10)
    const row = screen.getByRole("row", { name: /Low Stock Item/i });
    expect(within(row).getByText("5")).toHaveClass("text-red-600");
  });

  it("displays dash when barcode is missing", () => {
    const productWithoutBarcode = { ...mockProducts[0], barcode: undefined };

    render(
      <ProductTable
        products={[productWithoutBarcode]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("applies opacity to deleted products", () => {
    render(
      <ProductTable
        products={[mockProducts[2]]} // Archived product
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        showArchived
      />
    );

    const row = screen.getByRole("row", { name: /Archived Product/i });
    expect(row).toHaveClass("opacity-60");
  });

  it("renders all products in the list", () => {
    render(
      <ProductTable
        products={mockProducts}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    expect(screen.getByText("Low Stock Item")).toBeInTheDocument();
    expect(screen.getByText("Archived Product")).toBeInTheDocument();
  });

  it("displays category as badge", () => {
    render(
      <ProductTable
        products={[mockProducts[0]]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const badge = screen.getByText("Electronics");
    expect(badge).toBeInTheDocument();
  });

  it("shows Uncategorized for products without category", () => {
    const productWithoutCategory = { ...mockProducts[0], category: "" };

    render(
      <ProductTable
        products={[productWithoutCategory]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText("Uncategorized")).toBeInTheDocument();
  });
});
