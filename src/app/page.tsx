"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingCart, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { useTodaysSummary, useRecentSales } from "@/hooks/use-sales";
import { useProducts } from "@/hooks/use-products";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  // Fetch real data from Firestore
  const { data: todaySummary, isLoading: summaryLoading } = useTodaysSummary();
  const { data: recentSales, isLoading: salesLoading } = useRecentSales(5);
  const { data: products, isLoading: productsLoading } = useProducts({ lowStock: true });

  const isLoading = summaryLoading || salesLoading || productsLoading;

  // Calculate stats from real data
  const stats = [
    {
      title: "Today's Revenue",
      value: formatCurrency(todaySummary?.totalRevenue ?? 0),
      subtitle: "gross sales",
      icon: DollarSign,
    },
    {
      title: "Today's Orders",
      value: String(todaySummary?.totalSales ?? 0),
      subtitle: "transactions",
      icon: ShoppingCart,
    },
    {
      title: "Average Order",
      value: formatCurrency(todaySummary?.averageOrderValue ?? 0),
      subtitle: "per transaction",
      icon: TrendingUp,
    },
    {
      title: "Low Stock Alerts",
      value: String(products?.length ?? 0),
      subtitle: "products need restocking",
      icon: AlertTriangle,
      isAlert: (products?.length ?? 0) > 0,
    },
  ];

  // Format time for display
  const formatTime = (timestamp: number | Date) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format payment type for display
  const formatPaymentType = (type: string) => {
    const types: Record<string, string> = {
      cash: "Cash",
      card: "Card",
      google_pay: "Google Pay",
      wipay: "WiPay",
    };
    return types[type.toLowerCase()] || type;
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your store today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon
                className={`h-4 w-4 ${
                  stat.isAlert ? "text-amber-500" : "text-muted-foreground"
                }`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest sales from your POS terminal</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSales && recentSales.length > 0 ? (
              <div className="space-y-4">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{sale.receiptId}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(sale.timestamp)} • {formatPaymentType(sale.paymentType)}
                      </p>
                    </div>
                    <div className="text-sm font-medium">
                      {formatCurrency(sale.totalPrice)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No sales recorded yet today
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>Products that need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            {products && products.length > 0 ? (
              <div className="space-y-4">
                {products.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Alert level: {product.stockAlertLevel}
                      </p>
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        product.stock <= 3 ? "text-red-600" : "text-amber-600"
                      }`}
                    >
                      {product.stock} left
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                All products are well stocked
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Today&apos;s Payment Breakdown
          </CardTitle>
          <CardDescription>Sales by payment method</CardDescription>
        </CardHeader>
        <CardContent>
          {todaySummary && todaySummary.totalSales > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold">
                  {todaySummary.byPaymentType?.cash ?? 0}
                </div>
                <p className="text-sm text-muted-foreground">Cash transactions</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold">
                  {todaySummary.byPaymentType?.card ?? 0}
                </div>
                <p className="text-sm text-muted-foreground">Card transactions</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold">
                  {todaySummary.byPaymentType?.google_pay ?? 0}
                </div>
                <p className="text-sm text-muted-foreground">Google Pay transactions</p>
              </div>
            </div>
          ) : (
            <div className="flex h-[100px] items-center justify-center rounded-lg border border-dashed">
              <p className="text-muted-foreground">
                No sales recorded yet today
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
