"use client";

import Image from "next/image";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, RotateCcw, AlertTriangle, Package } from "lucide-react";
import type { Product } from "@/types";

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onRestore?: (product: Product) => void;
  showArchived?: boolean;
}

export function ProductTable({
  products,
  onEdit,
  onDelete,
  onRestore,
  showArchived = false,
}: ProductTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (products.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {showArchived ? "No archived products" : "No products found"}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[60px]"></TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Barcode</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => {
          const isLowStock = product.stock <= (product.stockAlertLevel || 10);

          return (
            <TableRow key={product.id} className={product.isDeleted ? "opacity-60" : ""}>
              <TableCell>
                <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {product.name}
                  {isLowStock && !product.isDeleted && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{product.category || "Uncategorized"}</Badge>
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {product.barcode || "-"}
              </TableCell>
              <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
              <TableCell className="text-right">
                <span
                  className={
                    isLowStock && !product.isDeleted ? "font-medium text-red-600" : ""
                  }
                >
                  {product.stock}
                </span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!product.isDeleted && (
                      <>
                        <DropdownMenuItem onClick={() => onEdit(product)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(product)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                      </>
                    )}
                    {product.isDeleted && onRestore && (
                      <DropdownMenuItem onClick={() => onRestore(product)}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Restore
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
