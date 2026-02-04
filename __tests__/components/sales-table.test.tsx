import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SalesTable } from "@/components/sales/sales-table";
import type { Sale } from "@/types";

const mockSales: Sale[] = [
  {
    id: "1",
    receiptId: "RCP-001",
    productId: "prod1",
    quantity: 2,
    timestamp: new Date("2024-01-15T10:30:00"),
    paymentType: "cash",
    totalPrice: 25.5,
    totalPriceCents: 2550,
    discount: 0,
    discountCents: 0,
    changeDue: 4.5,
    changeDueCents: 450,
    tenantId: "tenant1",
  },
  {
    id: "2",
    receiptId: "RCP-002",
    productId: "prod2",
    quantity: 1,
    timestamp: new Date("2024-01-15T14:45:00"),
    paymentType: "card",
    totalPrice: 99.99,
    totalPriceCents: 9999,
    discount: 10,
    discountCents: 1000,
    changeDue: 0,
    changeDueCents: 0,
    tenantId: "tenant1",
    gatewayTransactionId: "txn_abc123",
  },
  {
    id: "3",
    receiptId: "RCP-003",
    productId: "prod3",
    quantity: 3,
    timestamp: new Date("2024-01-15T16:00:00"),
    paymentType: "google_pay",
    totalPrice: 45.0,
    totalPriceCents: 4500,
    discount: 0,
    discountCents: 0,
    changeDue: 0,
    changeDueCents: 0,
    tenantId: "tenant1",
  },
];

describe("SalesTable", () => {
  it("renders sale data correctly", () => {
    render(<SalesTable sales={[mockSales[0]]} onViewDetails={vi.fn()} />);

    expect(screen.getByText("RCP-001")).toBeInTheDocument();
    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.getByText("$25.50")).toBeInTheDocument();
  });

  it("displays empty state when no sales", () => {
    render(<SalesTable sales={[]} onViewDetails={vi.fn()} />);

    expect(
      screen.getByText("No sales found for the selected filters")
    ).toBeInTheDocument();
  });

  it("shows discount when present", () => {
    render(<SalesTable sales={[mockSales[1]]} onViewDetails={vi.fn()} />);

    // Discount should be shown with negative sign
    expect(screen.getByText("-$10.00")).toBeInTheDocument();
  });

  it("shows dash when no discount", () => {
    render(<SalesTable sales={[mockSales[0]]} onViewDetails={vi.fn()} />);

    // Should show a dash for no discount
    const cells = screen.getAllByRole("cell");
    const discountCell = cells.find((cell) => cell.textContent === "-");
    expect(discountCell).toBeInTheDocument();
  });

  it("displays correct payment type badges", () => {
    render(<SalesTable sales={mockSales} onViewDetails={vi.fn()} />);

    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.getByText("Card")).toBeInTheDocument();
    expect(screen.getByText("Google Pay")).toBeInTheDocument();
  });

  it("calls onViewDetails when view button is clicked", async () => {
    const user = userEvent.setup();
    const onViewDetails = vi.fn();

    render(<SalesTable sales={[mockSales[0]]} onViewDetails={onViewDetails} />);

    const viewButton = screen.getByRole("button");
    await user.click(viewButton);

    expect(onViewDetails).toHaveBeenCalledWith(mockSales[0]);
  });

  it("renders all sales in the list", () => {
    render(<SalesTable sales={mockSales} onViewDetails={vi.fn()} />);

    expect(screen.getByText("RCP-001")).toBeInTheDocument();
    expect(screen.getByText("RCP-002")).toBeInTheDocument();
    expect(screen.getByText("RCP-003")).toBeInTheDocument();
  });

  it("formats currency correctly", () => {
    render(<SalesTable sales={[mockSales[1]]} onViewDetails={vi.fn()} />);

    expect(screen.getByText("$99.99")).toBeInTheDocument();
  });
});
