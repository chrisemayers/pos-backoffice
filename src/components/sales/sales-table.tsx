"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Receipt } from "lucide-react";
import type { Sale } from "@/types";

interface SalesTableProps {
  sales: Sale[];
  onViewDetails: (sale: Sale) => void;
}

const paymentTypeColors: Record<string, "default" | "secondary" | "outline"> = {
  cash: "default",
  card: "secondary",
  google_pay: "outline",
};

export function SalesTable({ sales, onViewDetails }: SalesTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
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

  if (sales.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Receipt className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>No sales found for the selected filters</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Receipt ID</TableHead>
          <TableHead>Date & Time</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead className="text-right">Discount</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="w-[80px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.map((sale) => (
          <TableRow key={sale.id}>
            <TableCell className="font-mono text-sm">
              {sale.receiptId}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(sale.timestamp)}
            </TableCell>
            <TableCell>
              <Badge variant={paymentTypeColors[sale.paymentType] || "secondary"}>
                {formatPaymentType(sale.paymentType)}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {sale.discount > 0 ? (
                <span className="text-green-600">
                  -{formatCurrency(sale.discount)}
                </span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(sale.totalPrice)}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(sale)}
              >
                <Eye className="h-4 w-4" />
                <span className="sr-only">View details</span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
