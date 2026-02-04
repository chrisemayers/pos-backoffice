"use client";

import { useState } from "react";
import { Search, Filter, Calendar, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SalesTable } from "@/components/sales/sales-table";
import { SaleDetailsDialog } from "@/components/sales/sale-details-dialog";
import { useSales, useTodaysSummary } from "@/hooks/use-sales";
import type { Sale } from "@/types";
import type { SaleFilters } from "@/lib/firestore/sales";

type DateRange = "today" | "week" | "month" | "all";

export default function SalesPage() {
  const [receiptSearch, setReceiptSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Calculate date filters based on range selection
  const getDateFilters = (): { startDate?: Date; endDate?: Date } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateRange) {
      case "today":
        return {
          startDate: today,
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        };
      case "week": {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { startDate: weekAgo, endDate: now };
      }
      case "month": {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return { startDate: monthAgo, endDate: now };
      }
      default:
        return {};
    }
  };

  // Build filters for query
  const filters: SaleFilters = {
    ...getDateFilters(),
    paymentType: paymentFilter !== "all" ? paymentFilter : undefined,
    receiptId: receiptSearch || undefined,
  };

  // Queries
  const { data: sales = [], isLoading } = useSales(filters);
  const { data: todaysSummary } = useTodaysSummary();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales History</h1>
        <p className="text-muted-foreground">View and search past transactions</p>
      </div>

      {/* Today's Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysSummary?.totalSales ?? 0}</div>
            <p className="text-xs text-muted-foreground">transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(todaysSummary?.totalRevenue ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">gross sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(todaysSummary?.averageOrderValue ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash vs Card</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold">
                {todaysSummary?.byPaymentType?.cash ?? 0}
              </span>
              <span className="text-sm text-muted-foreground">cash</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-lg font-bold">
                {(todaysSummary?.byPaymentType?.card ?? 0) +
                  (todaysSummary?.byPaymentType?.google_pay ?? 0)}
              </span>
              <span className="text-sm text-muted-foreground">card</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Transactions</CardTitle>

            <div className="flex flex-wrap items-center gap-2">
              {/* Receipt Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search receipt ID..."
                  value={receiptSearch}
                  onChange={(e) => setReceiptSearch(e.target.value)}
                  className="w-[180px] pl-9"
                />
              </div>

              {/* Date Range */}
              <Select
                value={dateRange}
                onValueChange={(v) => setDateRange(v as DateRange)}
              >
                <SelectTrigger className="w-[130px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>

              {/* Payment Type Filter */}
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="google_pay">Google Pay</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {(receiptSearch || paymentFilter !== "all" || dateRange !== "today") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReceiptSearch("");
                    setPaymentFilter("all");
                    setDateRange("today");
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading sales...
            </div>
          ) : (
            <SalesTable sales={sales} onViewDetails={setSelectedSale} />
          )}
        </CardContent>
      </Card>

      {/* Sale Details Dialog */}
      <SaleDetailsDialog
        sale={selectedSale}
        open={!!selectedSale}
        onOpenChange={(open) => !open && setSelectedSale(null)}
      />
    </div>
  );
}
