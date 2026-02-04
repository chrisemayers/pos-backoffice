"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Loader2 } from "lucide-react";
import type { Settings } from "@/types";

const taxSchema = z.object({
  taxEnabled: z.boolean(),
  taxRate: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    },
    { message: "Tax rate must be between 0 and 100" }
  ),
});

type TaxFormData = z.infer<typeof taxSchema>;

interface TaxSettingsFormProps {
  settings: Settings;
  onSubmit: (data: TaxFormData) => Promise<void>;
  isLoading?: boolean;
}

export function TaxSettingsForm({ settings, onSubmit, isLoading }: TaxSettingsFormProps) {
  const form = useForm<TaxFormData>({
    resolver: zodResolver(taxSchema),
    defaultValues: {
      taxEnabled: settings.taxEnabled,
      taxRate: settings.taxRate,
    },
  });

  const taxEnabled = form.watch("taxEnabled");

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Tax Settings
        </CardTitle>
        <CardDescription>
          Configure sales tax for transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="taxEnabled"
              {...form.register("taxEnabled")}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="taxEnabled" className="font-normal">
              Enable sales tax
            </Label>
          </div>

          {taxEnabled && (
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <div className="relative w-32">
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...form.register("taxRate")}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  %
                </span>
              </div>
              {form.formState.errors.taxRate && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.taxRate.message}
                </p>
              )}
            </div>
          )}

          <Button type="submit" disabled={isLoading || !form.formState.isDirty}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
