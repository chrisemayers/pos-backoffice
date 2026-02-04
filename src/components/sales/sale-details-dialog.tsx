"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Receipt, CreditCard, Calendar, Hash } from "lucide-react";
import type { Sale } from "@/types";

interface SaleDetailsDialogProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaleDetailsDialog({
  sale,
  open,
  onOpenChange,
}: SaleDetailsDialogProps) {
  if (!sale) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
      timeStyle: "medium",
    }).format(date);
  };

  const formatPaymentType = (type: string) => {
    const labels: Record<string, string> = {
      cash: "Cash",
      card: "Card",
      google_pay: "Google Pay",
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Sale Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Receipt ID */}
          <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Receipt ID</p>
              <p className="font-mono font-medium">{sale.receiptId}</p>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Date & Time</p>
              <p className="font-medium">{formatDate(sale.timestamp)}</p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <div className="flex items-center gap-2">
                <Badge>{formatPaymentType(sale.paymentType)}</Badge>
                {sale.gatewayTransactionId && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {sale.gatewayTransactionId}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Transaction Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Quantity</span>
              <span>{sale.quantity} item(s)</span>
            </div>

            {sale.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-green-600">
                  -{formatCurrency(sale.discount)}
                </span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span className="text-lg">{formatCurrency(sale.totalPrice)}</span>
            </div>

            {sale.paymentType === "cash" && sale.changeDue > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Change Due</span>
                <span>{formatCurrency(sale.changeDue)}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
