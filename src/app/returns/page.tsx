"use client";

import { useState } from "react";
import { RotateCcw, Calendar, DollarSign, Package, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReturns, useTodaysReturnsSummary } from "@/hooks/use-returns";
import { formatCurrency } from "@/lib/utils";
import type { ReturnFilters } from "@/lib/firestore/returns";

type DateRange = "today" | "week" | "month" | "all";

export default function ReturnsPage() {
  const [saleIdSearch, setSaleIdSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("week");

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
  const filters: ReturnFilters = {
    ...getDateFilters(),
    originalSaleId: saleIdSearch || undefined,
  };

  // Queries
  const { data: returns = [], isLoading } = useReturns(filters);
  const { data: todaysSummary } = useTodaysReturnsSummary();

  // Format time for display
  const formatDateTime = (timestamp: number | Date) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Returns</h1>
        <p className="text-muted-foreground">View and manage product returns</p>
      </div>

      {/* Today's Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Returns</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysSummary?.totalReturns ?? 0}</div>
            <p className="text-xs text-muted-foreground">return transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunded</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(todaysSummary?.totalRefunded ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">today&apos;s refunds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Returned</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysSummary?.itemsReturned ?? 0}</div>
            <p className="text-xs text-muted-foreground">products returned today</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Return History</CardTitle>

            <div className="flex flex-wrap items-center gap-2">
              {/* Sale ID Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by sale ID..."
                  value={saleIdSearch}
                  onChange={(e) => setSaleIdSearch(e.target.value)}
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading returns...
            </div>
          ) : returns.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No returns found for the selected period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return ID</TableHead>
                  <TableHead>Original Sale</TableHead>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Refund Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((ret) => (
                  <TableRow key={ret.id}>
                    <TableCell className="font-medium">
                      {ret.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{ret.originalSaleId}</TableCell>
                    <TableCell>{formatDateTime(ret.timestamp)}</TableCell>
                    <TableCell>
                      {ret.items.reduce((sum, item) => sum + item.quantity, 0)} items
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      -{formatCurrency(ret.refundAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
