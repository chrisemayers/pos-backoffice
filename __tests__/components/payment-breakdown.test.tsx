import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PaymentBreakdown } from "@/components/reports/payment-breakdown";

describe("PaymentBreakdown", () => {
  it("renders payment type data correctly", () => {
    const data = {
      cash: 10,
      card: 20,
      google_pay: 5,
    };

    render(<PaymentBreakdown data={data} />);

    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.getByText("Card")).toBeInTheDocument();
    expect(screen.getByText("Google Pay")).toBeInTheDocument();
  });

  it("shows correct percentages", () => {
    const data = {
      cash: 50,
      card: 50,
    };

    render(<PaymentBreakdown data={data} />);

    // Both should be 50% - there will be two elements with this text
    const percentages = screen.getAllByText("50 (50.0%)");
    expect(percentages).toHaveLength(2);
  });

  it("displays empty state when no transactions", () => {
    render(<PaymentBreakdown data={{}} />);

    expect(
      screen.getByText("No transactions in this period")
    ).toBeInTheDocument();
  });

  it("uses custom title when provided", () => {
    render(<PaymentBreakdown data={{ cash: 10 }} title="Custom Title" />);

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
  });

  it("uses default title when not provided", () => {
    render(<PaymentBreakdown data={{ cash: 10 }} />);

    expect(screen.getByText("Payment Methods")).toBeInTheDocument();
  });

  it("handles single payment type", () => {
    const data = {
      cash: 100,
    };

    render(<PaymentBreakdown data={data} />);

    expect(screen.getByText("100 (100.0%)")).toBeInTheDocument();
  });

  it("calculates correct percentages for multiple types", () => {
    const data = {
      cash: 25,
      card: 75,
    };

    render(<PaymentBreakdown data={data} />);

    expect(screen.getByText("25 (25.0%)")).toBeInTheDocument();
    expect(screen.getByText("75 (75.0%)")).toBeInTheDocument();
  });
});
