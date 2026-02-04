import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RevenueChart } from "@/components/reports/revenue-chart";
import type { DailyRevenue } from "@/types";

const mockData: DailyRevenue[] = [
  { date: "2024-01-15", revenue: 1500 },
  { date: "2024-01-16", revenue: 2200 },
  { date: "2024-01-17", revenue: 1800 },
];

describe("RevenueChart", () => {
  it("renders revenue data correctly", () => {
    render(<RevenueChart data={mockData} />);

    expect(screen.getByText("$1,500")).toBeInTheDocument();
    expect(screen.getByText("$2,200")).toBeInTheDocument();
    expect(screen.getByText("$1,800")).toBeInTheDocument();
  });

  it("displays empty state when no data", () => {
    render(<RevenueChart data={[]} />);

    expect(
      screen.getByText("No data available for this period")
    ).toBeInTheDocument();
  });

  it("uses custom title when provided", () => {
    render(<RevenueChart data={mockData} title="Custom Revenue Title" />);

    expect(screen.getByText("Custom Revenue Title")).toBeInTheDocument();
  });

  it("uses default title when not provided", () => {
    render(<RevenueChart data={mockData} />);

    expect(screen.getByText("Revenue Over Time")).toBeInTheDocument();
  });

  it("formats dates correctly", () => {
    render(<RevenueChart data={[{ date: "2024-01-15", revenue: 1000 }]} />);

    // Date formatting depends on timezone, just check a date is rendered
    expect(screen.getByText(/Jan \d+/)).toBeInTheDocument();
  });

  it("renders all data points", () => {
    render(<RevenueChart data={mockData} />);

    // Should render 3 date labels (one per data point)
    const dateLabels = screen.getAllByText(/Jan \d+/);
    expect(dateLabels).toHaveLength(3);
  });

  it("handles single data point", () => {
    render(<RevenueChart data={[{ date: "2024-01-15", revenue: 500 }]} />);

    expect(screen.getByText("$500")).toBeInTheDocument();
    expect(screen.getByText(/Jan \d+/)).toBeInTheDocument();
  });

  it("handles zero revenue", () => {
    render(<RevenueChart data={[{ date: "2024-01-15", revenue: 0 }]} />);

    expect(screen.getByText("$0")).toBeInTheDocument();
  });
});
