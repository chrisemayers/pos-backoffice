import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopProducts } from "@/components/reports/top-products";
import type { TopProduct } from "@/types";

const mockProducts: TopProduct[] = [
  {
    productId: "1",
    productName: "Best Seller",
    totalQuantity: 100,
    totalRevenue: 999.99,
  },
  {
    productId: "2",
    productName: "Second Place",
    totalQuantity: 75,
    totalRevenue: 749.25,
  },
  {
    productId: "3",
    productName: "Third Place",
    totalQuantity: 50,
    totalRevenue: 499.5,
  },
  {
    productId: "4",
    productName: "Fourth Place",
    totalQuantity: 25,
    totalRevenue: 249.75,
  },
];

describe("TopProducts", () => {
  it("renders product data correctly", () => {
    render(<TopProducts products={mockProducts} />);

    expect(screen.getByText("Best Seller")).toBeInTheDocument();
    expect(screen.getByText("Second Place")).toBeInTheDocument();
    expect(screen.getByText("$999.99")).toBeInTheDocument();
  });

  it("displays empty state when no products", () => {
    render(<TopProducts products={[]} />);

    expect(screen.getByText("No product data available")).toBeInTheDocument();
  });

  it("uses custom title when provided", () => {
    render(<TopProducts products={mockProducts} title="Custom Title" />);

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
  });

  it("uses default title when not provided", () => {
    render(<TopProducts products={mockProducts} />);

    expect(screen.getByText("Top Selling Products")).toBeInTheDocument();
  });

  it("shows ranking numbers", () => {
    render(<TopProducts products={mockProducts} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("displays quantity sold", () => {
    render(<TopProducts products={[mockProducts[0]]} />);

    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("formats revenue as currency", () => {
    render(<TopProducts products={[mockProducts[0]]} />);

    expect(screen.getByText("$999.99")).toBeInTheDocument();
  });

  it("renders all products in the list", () => {
    render(<TopProducts products={mockProducts} />);

    expect(screen.getByText("Best Seller")).toBeInTheDocument();
    expect(screen.getByText("Second Place")).toBeInTheDocument();
    expect(screen.getByText("Third Place")).toBeInTheDocument();
    expect(screen.getByText("Fourth Place")).toBeInTheDocument();
  });
});
