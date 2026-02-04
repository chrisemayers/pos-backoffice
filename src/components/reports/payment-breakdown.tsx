"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, CreditCard, Smartphone } from "lucide-react";

interface PaymentBreakdownProps {
  data: Record<string, number>;
  title?: string;
}

const paymentConfig: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  cash: { label: "Cash", icon: Banknote, color: "bg-green-500" },
  card: { label: "Card", icon: CreditCard, color: "bg-blue-500" },
  google_pay: { label: "Google Pay", icon: Smartphone, color: "bg-purple-500" },
};

export function PaymentBreakdown({
  data,
  title = "Payment Methods",
}: PaymentBreakdownProps) {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[150px] items-center justify-center text-muted-foreground">
            No transactions in this period
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual bar */}
        <div className="flex h-4 overflow-hidden rounded-full">
          {Object.entries(data).map(([type, count]) => {
            const percentage = (count / total) * 100;
            const config = paymentConfig[type] || {
              color: "bg-gray-500",
            };
            return (
              <div
                key={type}
                className={`${config.color} transition-all`}
                style={{ width: `${percentage}%` }}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Object.entries(data).map(([type, count]) => {
            const config = paymentConfig[type] || {
              label: type,
              icon: CreditCard,
              color: "bg-gray-500",
            };
            const Icon = config.icon;
            const percentage = ((count / total) * 100).toFixed(1);

            return (
              <div
                key={type}
                className="flex items-center gap-2 rounded-lg border p-3"
              >
                <div className={`rounded-full p-2 ${config.color} text-white`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{config.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {count} ({percentage}%)
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
