"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, Loader2 } from "lucide-react";
import type { Settings } from "@/types";

interface ReceiptFormData {
  receiptSharingEnabled: boolean;
  printerEnabled: boolean;
}

interface ReceiptSettingsFormProps {
  settings: Settings;
  onSubmit: (data: ReceiptFormData) => Promise<void>;
  isLoading?: boolean;
}

export function ReceiptSettingsForm({ settings, onSubmit, isLoading }: ReceiptSettingsFormProps) {
  const form = useForm<ReceiptFormData>({
    defaultValues: {
      receiptSharingEnabled: settings.receiptSharingEnabled,
      printerEnabled: settings.printerEnabled,
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Receipt Settings
        </CardTitle>
        <CardDescription>
          Configure receipt generation and sharing options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="receiptSharingEnabled"
                {...form.register("receiptSharingEnabled")}
                className="h-4 w-4 rounded border-gray-300"
              />
              <div>
                <Label htmlFor="receiptSharingEnabled">Enable receipt sharing</Label>
                <p className="text-sm text-muted-foreground">
                  Allow customers to receive receipts via email or SMS
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="printerEnabled"
                {...form.register("printerEnabled")}
                className="h-4 w-4 rounded border-gray-300"
              />
              <div>
                <Label htmlFor="printerEnabled">Enable printer</Label>
                <p className="text-sm text-muted-foreground">
                  Print physical receipts (requires compatible printer)
                </p>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isLoading || !form.formState.isDirty}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
