"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingCart, TrendingUp, AlertTriangle } from "lucide-react";

// Placeholder data - will be replaced with real Firestore data
const stats = [
  {
    title: "Today's Revenue",
    value: "$1,234.56",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: DollarSign,
  },
  {
    title: "Total Orders",
    value: "48",
    change: "+8.2%",
    changeType: "positive" as const,
    icon: ShoppingCart,
  },
  {
    title: "Products in Stock",
    value: "256",
    change: "-2",
    changeType: "neutral" as const,
    icon: Package,
  },
  {
    title: "Low Stock Alerts",
    value: "5",
    change: "+2",
    changeType: "negative" as const,
    icon: AlertTriangle,
  },
];

const recentTransactions = [
  { id: "RCP-20260202-001", time: "10:23 AM", amount: "$45.99", items: 3, payment: "Google Pay" },
  { id: "RCP-20260202-002", time: "10:45 AM", amount: "$12.50", items: 1, payment: "Cash" },
  { id: "RCP-20260202-003", time: "11:02 AM", amount: "$89.00", items: 5, payment: "Google Pay" },
  { id: "RCP-20260202-004", time: "11:30 AM", amount: "$23.75", items: 2, payment: "Cash" },
  { id: "RCP-20260202-005", time: "11:55 AM", amount: "$156.00", items: 8, payment: "WiPay" },
];

const lowStockProducts = [
  { name: "Organic Apples", stock: 5, alertLevel: 10 },
  { name: "Whole Milk 1L", stock: 3, alertLevel: 15 },
  { name: "Bread Loaf", stock: 2, alertLevel: 10 },
  { name: "Eggs (12pk)", stock: 4, alertLevel: 8 },
  { name: "Butter 500g", stock: 6, alertLevel: 10 },
];

export default function DashboardPage() {
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
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p
                className={`text-xs ${
                  stat.changeType === "positive"
                    ? "text-green-600"
                    : stat.changeType === "negative"
                    ? "text-red-600"
                    : "text-muted-foreground"
                }`}
              >
                {stat.change} from yesterday
              </p>
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
            <div className="space-y-4">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{tx.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.time} • {tx.items} items • {tx.payment}
                    </p>
                  </div>
                  <div className="text-sm font-medium">{tx.amount}</div>
                </div>
              ))}
            </div>
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
            <div className="space-y-4">
              {lowStockProducts.map((product) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Alert level: {product.alertLevel}
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
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Trend
          </CardTitle>
          <CardDescription>Daily revenue for the past 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">
              Chart will be populated with real Firestore data
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
