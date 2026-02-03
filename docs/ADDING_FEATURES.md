# Adding Features Guide

This guide walks through the process of adding new features to the POS Back Office application.

## Overview

Adding a new feature typically involves:

1. Define types
2. Create Firestore queries
3. Create React Query hooks
4. Build UI components
5. Create the page
6. Add navigation
7. Write tests

## Example: Adding Inventory Management

Let's walk through adding a complete Inventory Management feature.

### Step 1: Define Types

First, ensure types are defined in `src/types/index.ts`:

```typescript
// src/types/index.ts

export interface Product {
    id: string;
    name: string;
    price: number;
    priceCents: number;
    stock: number;
    barcode?: string;
    category: string;
    stockAlertLevel: number;
    isDeleted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ProductFilters {
    search?: string;
    category?: string;
    lowStock?: boolean;
    includeDeleted?: boolean;
}

export type CreateProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;
export type UpdateProductInput = Partial<CreateProductInput> & { id: string };
```

### Step 2: Create Firestore Queries

Create data access functions in `src/lib/firestore/products.ts`:

```typescript
// src/lib/firestore/products.ts
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product, ProductFilters, CreateProductInput, UpdateProductInput } from "@/types";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID!;

// Collection reference helper
function productsCollection() {
    return collection(db, `tenants/${TENANT_ID}/products`);
}

// Fetch all products with optional filters
export async function fetchProducts(filters?: ProductFilters): Promise<Product[]> {
    let q = query(productsCollection(), orderBy("name"));

    if (filters?.category) {
        q = query(q, where("category", "==", filters.category));
    }

    if (!filters?.includeDeleted) {
        q = query(q, where("isDeleted", "==", false));
    }

    if (filters?.lowStock) {
        // Note: This requires a composite index in Firestore
        q = query(q, where("stock", "<=", 10));
    }

    const snapshot = await getDocs(q);
    const products = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
    })) as Product[];

    // Client-side search filter (Firestore doesn't support full-text search)
    if (filters?.search) {
        const search = filters.search.toLowerCase();
        return products.filter(
            (p) =>
                p.name.toLowerCase().includes(search) || p.barcode?.toLowerCase().includes(search),
        );
    }

    return products;
}

// Fetch single product
export async function fetchProduct(id: string): Promise<Product | null> {
    const docRef = doc(productsCollection(), id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) return null;

    return {
        id: snapshot.id,
        ...snapshot.data(),
        createdAt: snapshot.data().createdAt?.toDate(),
        updatedAt: snapshot.data().updatedAt?.toDate(),
    } as Product;
}

// Create product
export async function createProduct(input: CreateProductInput): Promise<Product> {
    const docRef = await addDoc(productsCollection(), {
        ...input,
        priceCents: Math.round(input.price * 100),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

    return {
        id: docRef.id,
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

// Update product
export async function updateProduct(input: UpdateProductInput): Promise<void> {
    const { id, ...data } = input;
    const docRef = doc(productsCollection(), id);

    await updateDoc(docRef, {
        ...data,
        ...(data.price !== undefined && { priceCents: Math.round(data.price * 100) }),
        updatedAt: Timestamp.now(),
    });
}

// Soft delete product
export async function deleteProduct(id: string): Promise<void> {
    const docRef = doc(productsCollection(), id);
    await updateDoc(docRef, {
        isDeleted: true,
        updatedAt: Timestamp.now(),
    });
}

// Fetch categories (distinct values)
export async function fetchCategories(): Promise<string[]> {
    const products = await fetchProducts({ includeDeleted: false });
    const categories = [...new Set(products.map((p) => p.category))];
    return categories.sort();
}
```

### Step 3: Create React Query Hooks

Create hooks in `src/hooks/use-products.ts`:

```typescript
// src/hooks/use-products.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    fetchCategories,
} from "@/lib/firestore/products";
import type { ProductFilters, CreateProductInput, UpdateProductInput } from "@/types";

// Query keys factory
export const productKeys = {
    all: ["products"] as const,
    lists: () => [...productKeys.all, "list"] as const,
    list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
    details: () => [...productKeys.all, "detail"] as const,
    detail: (id: string) => [...productKeys.details(), id] as const,
    categories: () => [...productKeys.all, "categories"] as const,
};

// List products
export function useProducts(filters?: ProductFilters) {
    return useQuery({
        queryKey: productKeys.list(filters ?? {}),
        queryFn: () => fetchProducts(filters),
    });
}

// Single product
export function useProduct(id: string) {
    return useQuery({
        queryKey: productKeys.detail(id),
        queryFn: () => fetchProduct(id),
        enabled: !!id,
    });
}

// Categories
export function useCategories() {
    return useQuery({
        queryKey: productKeys.categories(),
        queryFn: fetchCategories,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// Create product mutation
export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateProductInput) => createProduct(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
            queryClient.invalidateQueries({ queryKey: productKeys.categories() });
        },
    });
}

// Update product mutation
export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: UpdateProductInput) => updateProduct(input),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
            queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
        },
    });
}

// Delete product mutation
export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
        },
    });
}
```

### Step 4: Build UI Components

Create components in `src/components/inventory/`:

```typescript
// src/components/inventory/product-table.tsx
'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Product } from '@/types';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead className="w-12.5"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>
              <Badge variant="secondary">{product.category}</Badge>
            </TableCell>
            <TableCell className="text-right">
              ${product.price.toFixed(2)}
            </TableCell>
            <TableCell className="text-right">
              <span
                className={
                  product.stock <= product.stockAlertLevel
                    ? 'text-red-600 font-medium'
                    : ''
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
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(product)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(product)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

```typescript
// src/components/inventory/product-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/use-products';
import type { Product } from '@/types';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.coerce.number().positive('Price must be positive'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  category: z.string().min(1, 'Category is required'),
  barcode: z.string().optional(),
  stockAlertLevel: z.coerce.number().int().min(0).default(10),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductForm({ product, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const { data: categories = [] } = useCategories();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? '',
      price: product?.price ?? 0,
      stock: product?.stock ?? 0,
      category: product?.category ?? '',
      barcode: product?.barcode ?? '',
      stockAlertLevel: product?.stockAlertLevel ?? 10,
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Product Name</Label>
        <Input id="name" {...form.register('name')} />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input id="price" type="number" step="0.01" {...form.register('price')} />
          {form.formState.errors.price && (
            <p className="text-sm text-red-500">{form.formState.errors.price.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Stock</Label>
          <Input id="stock" type="number" {...form.register('stock')} />
          {form.formState.errors.stock && (
            <p className="text-sm text-red-500">{form.formState.errors.stock.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={form.watch('category')}
          onValueChange={(value) => form.setValue('category', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.category && (
          <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="barcode">Barcode (Optional)</Label>
        <Input id="barcode" {...form.register('barcode')} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : product ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
```

### Step 5: Create the Page

Create the page in `src/app/inventory/page.tsx`:

```typescript
// src/app/inventory/page.tsx
'use client';

import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProductTable } from '@/components/inventory/product-table';
import { ProductForm } from '@/components/inventory/product-form';
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '@/hooks/use-products';
import type { Product, CreateProductInput, UpdateProductInput } from '@/types';

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: products = [], isLoading } = useProducts({ search });
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const handleCreate = async (data: CreateProductInput) => {
    await createMutation.mutateAsync({ ...data, isDeleted: false });
    setIsCreating(false);
  };

  const handleUpdate = async (data: UpdateProductInput) => {
    if (!editingProduct) return;
    await updateMutation.mutateAsync({ ...data, id: editingProduct.id });
    setEditingProduct(null);
  };

  const handleDelete = async (product: Product) => {
    if (confirm(`Delete "${product.name}"?`)) {
      await deleteMutation.mutateAsync(product.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your product catalog
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No products found
            </div>
          ) : (
            <ProductTable
              products={products}
              onEdit={setEditingProduct}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>
          <ProductForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreating(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <ProductForm
              product={editingProduct}
              onSubmit={handleUpdate}
              onCancel={() => setEditingProduct(null)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

### Step 6: Add Navigation

Update the sidebar in `src/components/app-sidebar.tsx`:

```typescript
// Already included in initial setup
const mainNavItems = [
    // ...
    {
        title: "Inventory",
        url: "/inventory",
        icon: Package,
    },
    // ...
];
```

### Step 7: Write Tests

Create tests in `__tests__/`:

```typescript
// __tests__/hooks/use-products.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProducts } from '@/hooks/use-products';

// Mock Firestore
vi.mock('@/lib/firestore/products', () => ({
  fetchProducts: vi.fn(() => Promise.resolve([
    { id: '1', name: 'Test Product', price: 9.99, stock: 10 },
  ])),
}));

describe('useProducts', () => {
  const wrapper = ({ children }) => (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );

  it('fetches products successfully', async () => {
    const { result } = renderHook(() => useProducts(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].name).toBe('Test Product');
  });
});
```

## Checklist for New Features

- [ ] Types defined in `src/types/index.ts`
- [ ] Firestore queries in `src/lib/firestore/`
- [ ] React Query hooks in `src/hooks/`
- [ ] UI components in `src/components/[feature]/`
- [ ] Page created in `src/app/[feature]/page.tsx`
- [ ] Navigation added to sidebar
- [ ] Loading states implemented
- [ ] Error states implemented
- [ ] Empty states implemented
- [ ] Unit tests written
- [ ] Component tests written
- [ ] Responsive design verified
- [ ] Accessibility checked

## Related Documents

- [Architecture Overview](./ARCHITECTURE.md)
- [Development Guidelines](./DEVELOPMENT.md)
- [Firebase Integration](./FIREBASE.md)
- [Component Patterns](./COMPONENTS.md)
