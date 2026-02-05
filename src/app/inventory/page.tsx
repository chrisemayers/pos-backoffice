"use client";

import { useState } from "react";
import { Plus, Search, Filter, Archive, Package } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ProductTable } from "@/components/inventory/product-table";
import { ProductForm, type ProductFormSubmitData } from "@/components/inventory/product-form";
import {
  useProducts,
  useCategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useRestoreProduct,
} from "@/hooks/use-products";
import { uploadProductImage } from "@/lib/storage/products";
import type { Product } from "@/types";

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showLowStock, setShowLowStock] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Queries
  const { data: products = [], isLoading } = useProducts({
    search: search || undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    lowStock: showLowStock,
    includeDeleted: activeTab === "archived",
  });

  const { data: categories = [] } = useCategories();

  // Mutations
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();
  const restoreMutation = useRestoreProduct();

  // Filter products by tab
  const filteredProducts = products.filter((p) =>
    activeTab === "archived" ? p.isDeleted : !p.isDeleted
  );

  // Stats
  const activeProducts = products.filter((p) => !p.isDeleted);
  const lowStockCount = activeProducts.filter(
    (p) => p.stock <= (p.stockAlertLevel || 10)
  ).length;
  const totalValue = activeProducts.reduce((sum, p) => sum + p.price * p.stock, 0);

  const handleCreate = async (data: ProductFormSubmitData) => {
    try {
      // First create the product to get the ID
      const { imageFile, ...productData } = data;
      const product = await createMutation.mutateAsync({
        ...productData,
        priceCents: Math.round(data.price * 100),
      });

      // If there's an image file, upload it and update the product
      if (data.imageFile) {
        setIsUploadingImage(true);
        try {
          const imageUrl = await uploadProductImage(data.imageFile, product.id);
          await updateMutation.mutateAsync({
            id: product.id,
            imageUrl,
          });
          toast.success("Product created with image");
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          toast.error("Product created, but image upload failed. Please try uploading the image again.");
        } finally {
          setIsUploadingImage(false);
        }
      } else {
        toast.success("Product created");
      }

      setIsCreating(false);
    } catch (error) {
      console.error("Failed to create product:", error);
      toast.error("Failed to create product");
    }
  };

  const handleUpdate = async (data: ProductFormSubmitData) => {
    if (!editingProduct) return;

    try {
      let imageUrl = data.imageUrl;

      // If there's a new image file, upload it
      if (data.imageFile) {
        setIsUploadingImage(true);
        try {
          imageUrl = await uploadProductImage(data.imageFile, editingProduct.id);
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          toast.error("Image upload failed. Please try again.");
          setIsUploadingImage(false);
          return;
        }
        setIsUploadingImage(false);
      }

      const { imageFile: _, ...productData } = data;
      await updateMutation.mutateAsync({
        ...productData,
        priceCents: Math.round(data.price * 100),
        id: editingProduct.id,
        imageUrl,
      });
      toast.success("Product updated");
      setEditingProduct(null);
    } catch (error) {
      console.error("Failed to update product:", error);
      toast.error("Failed to update product");
    }
  };

  const handleDelete = async (product: Product) => {
    if (confirm(`Archive "${product.name}"? You can restore it later.`)) {
      await deleteMutation.mutateAsync(product.id);
    }
  };

  const handleRestore = async (product: Product) => {
    await restoreMutation.mutateAsync(product.id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProducts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Badge variant={lowStockCount > 0 ? "destructive" : "secondary"}>
              {lowStockCount}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Items below alert level</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">At current prices</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="active">Active Products</TabsTrigger>
                <TabsTrigger value="archived">
                  <Archive className="mr-2 h-4 w-4" />
                  Archived
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-[250px] pl-9"
                  />
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant={showLowStock ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowLowStock(!showLowStock)}
                >
                  Low Stock
                </Button>
              </div>
            </div>

            <TabsContent value="active" className="mt-4">
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading products...
                </div>
              ) : (
                <ProductTable
                  products={filteredProducts}
                  onEdit={setEditingProduct}
                  onDelete={handleDelete}
                />
              )}
            </TabsContent>

            <TabsContent value="archived" className="mt-4">
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading archived products...
                </div>
              ) : (
                <ProductTable
                  products={filteredProducts}
                  onEdit={setEditingProduct}
                  onDelete={handleDelete}
                  onRestore={handleRestore}
                  showArchived
                />
              )}
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>
          <ProductForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreating(false)}
            isLoading={createMutation.isPending || isUploadingImage}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <ProductForm
              product={editingProduct}
              onSubmit={handleUpdate}
              onCancel={() => setEditingProduct(null)}
              isLoading={updateMutation.isPending || isUploadingImage}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
