import { Truck, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function SuppliersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
        <p className="text-muted-foreground">Manage your supplier relationships</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Truck className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2 text-lg font-medium">
            <Construction className="h-5 w-5 text-amber-500" />
            Under Construction
          </div>
          <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
            The supplier management feature is coming soon. You&apos;ll be able to add
            suppliers, track contact information, and manage vendor relationships.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
