"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCategories } from "@/hooks/use-products";
import type { Product } from "@/types";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().positive("Price must be positive"),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  category: z.string().min(1, "Category is required"),
  barcode: z.string().optional(),
  stockAlertLevel: z.coerce.number().int().min(0).default(10),
});

type ProductFormData = z.infer<typeof productSchema>;

export interface ProductFormSubmitData {
  name: string;
  price: number;
  stock: number;
  category: string;
  barcode?: string;
  stockAlertLevel: number;
  isDeleted: boolean;
}

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormSubmitData) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductForm({ product, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const { data: existingCategories = [] } = useCategories();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    mode: "onChange",
    defaultValues: {
      name: product?.name ?? "",
      price: product?.price ?? 0,
      stock: product?.stock ?? 0,
      category: product?.category ?? "",
      barcode: product?.barcode ?? "",
      stockAlertLevel: product?.stockAlertLevel ?? 10,
    },
  });

  const handleFormSubmit = (data: ProductFormData) => {
    onSubmit({
      name: data.name,
      price: data.price,
      stock: data.stock,
      category: data.category,
      barcode: data.barcode || undefined,
      stockAlertLevel: data.stockAlertLevel,
      isDeleted: product?.isDeleted ?? false,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Product Name *</Label>
        <Input id="name" {...register("name")} placeholder="Enter product name" />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            {...register("price")}
            placeholder="0.00"
          />
          {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Stock *</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            {...register("stock")}
            placeholder="0"
          />
          {errors.stock && <p className="text-sm text-red-500">{errors.stock.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Input
          id="category"
          placeholder="Type or select a category"
          list="category-suggestions"
          {...register("category")}
        />
        <datalist id="category-suggestions">
          {existingCategories.map((cat) => (
            <option key={cat} value={cat} />
          ))}
        </datalist>
        {errors.category && (
          <p className="text-sm text-red-500">{errors.category.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="barcode">Barcode (Optional)</Label>
        <Input id="barcode" {...register("barcode")} placeholder="Enter barcode" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="stockAlertLevel">Low Stock Alert Level</Label>
        <Input
          id="stockAlertLevel"
          type="number"
          min="0"
          {...register("stockAlertLevel")}
          placeholder="10"
        />
        <p className="text-xs text-muted-foreground">
          Get notified when stock falls below this level
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : product ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
