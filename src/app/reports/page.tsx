"use client";

import { useState, useMemo } from "react";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RevenueChart } from "@/components/reports/revenue-chart";
import { PaymentBreakdown } from "@/components/reports/payment-breakdown";
import { TopProducts } from "@/components/reports/top-products";
import { useComparisonReport, useDateRanges } from "@/hooks/use-reports";

type PeriodType = "week" | "month" | "last7" | "last30";

export default function ReportsPage() {
  const [period, setPeriod] = useState<PeriodType>("week");
  const dateRanges = useDateRanges();

  // Get date ranges based on selected period
  const { currentRange, previousRange } = useMemo(() => {
    switch (period) {
      case "week":
        return {
          currentRange: dateRanges.thisWeek,
          previousRange: dateRanges.lastWeek,
        };
      case "month":
        return {
          currentRange: dateRanges.thisMonth,
          previousRange: dateRanges.lastMonth,
        };
      case "last7":
        return {
          currentRange: dateRanges.last7Days,
          previousRange: {
            start: new Date(
              dateRanges.last7Days.start.getTime() - 7 * 24 * 60 * 60 * 1000
            ),
            end: dateRanges.last7Days.start,
          },
        };
      case "last30":
        return {
          currentRange: dateRanges.last30Days,
          previousRange: {
            start: new Date(
              dateRanges.last30Days.start.getTime() - 30 * 24 * 60 * 60 * 1000
            ),
            end: dateRanges.last30Days.start,
          },
        };
      default:
        return {
          currentRange: dateRanges.thisWeek,
          previousRange: dateRanges.lastWeek,
        };
    }
  }, [period, dateRanges]);

  const { data: report, isLoading } = useComparisonReport(
    currentRange.start,
    currentRange.end,
    previousRange.start,
    previousRange.end
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}%`;
  };

  const periodLabels: Record<PeriodType, string> = {
    week: "This Week",
    month: "This Month",
    last7: "Last 7 Days",
    last30: "Last 30 Days",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Analyze your sales performance and trends
          </p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
          <SelectTrigger className="w-[150px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="last7">Last 7 Days</SelectItem>
            <SelectItem value="last30">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">
          Loading report data...
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Total Revenue */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(report?.current.totalRevenue ?? 0)}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {(report?.changes.revenue ?? 0) >= 0 ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">
                        {formatChange(report?.changes.revenue ?? 0)}
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-red-600" />
                      <span className="text-red-600">
                        {formatChange(report?.changes.revenue ?? 0)}
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground">vs previous period</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Transactions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report?.current.totalSales ?? 0}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {(report?.changes.sales ?? 0) >= 0 ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">
                        {formatChange(report?.changes.sales ?? 0)}
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-red-600" />
                      <span className="text-red-600">
                        {formatChange(report?.changes.sales ?? 0)}
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground">vs previous period</span>
                </div>
              </CardContent>
            </Card>

            {/* Average Order Value */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Order</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(report?.current.averageOrderValue ?? 0)}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {(report?.changes.averageOrderValue ?? 0) >= 0 ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">
                        {formatChange(report?.changes.averageOrderValue ?? 0)}
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-red-600" />
                      <span className="text-red-600">
                        {formatChange(report?.changes.averageOrderValue ?? 0)}
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground">vs previous period</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 md:grid-cols-2">
            <RevenueChart
              data={report?.current.dailyRevenue ?? []}
              title={`Daily Revenue - ${periodLabels[period]}`}
            />
            <PaymentBreakdown
              data={report?.current.byPaymentType ?? {}}
              title="Payment Methods"
            />
          </div>

          {/* Top Products */}
          <TopProducts
            products={report?.current.topProducts ?? []}
            title={`Top Products - ${periodLabels[period]}`}
          />

          {/* Period Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Period Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    {periodLabels[period]}
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Revenue</span>
                      <span className="font-medium">
                        {formatCurrency(report?.current.totalRevenue ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transactions</span>
                      <span className="font-medium">{report?.current.totalSales ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Order</span>
                      <span className="font-medium">
                        {formatCurrency(report?.current.averageOrderValue ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4 opacity-75">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Previous Period
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Revenue</span>
                      <span className="font-medium">
                        {formatCurrency(report?.previous.totalRevenue ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transactions</span>
                      <span className="font-medium">{report?.previous.totalSales ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Order</span>
                      <span className="font-medium">
                        {formatCurrency(report?.previous.averageOrderValue ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
