"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Loader2 } from "lucide-react";
import type { Settings } from "@/types";

const businessInfoSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  businessAddress: z.string(),
  businessWebsite: z.string().url().or(z.literal("")),
  businessPhone: z.string(),
  showBusinessInfo: z.boolean(),
});

type BusinessInfoFormData = z.infer<typeof businessInfoSchema>;

interface BusinessInfoFormProps {
  settings: Settings;
  onSubmit: (data: BusinessInfoFormData) => Promise<void>;
  isLoading?: boolean;
}

export function BusinessInfoForm({ settings, onSubmit, isLoading }: BusinessInfoFormProps) {
  const form = useForm<BusinessInfoFormData>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      businessName: settings.businessName,
      businessAddress: settings.businessAddress,
      businessWebsite: settings.businessWebsite,
      businessPhone: settings.businessPhone,
      showBusinessInfo: settings.showBusinessInfo,
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Business Information
        </CardTitle>
        <CardDescription>
          Configure your business details that appear on receipts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              {...form.register("businessName")}
              placeholder="Your Business Name"
            />
            {form.formState.errors.businessName && (
              <p className="text-sm text-red-500">
                {form.formState.errors.businessName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessAddress">Address</Label>
            <Input
              id="businessAddress"
              {...form.register("businessAddress")}
              placeholder="123 Main St, City, State 12345"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessPhone">Phone</Label>
              <Input
                id="businessPhone"
                {...form.register("businessPhone")}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessWebsite">Website</Label>
              <Input
                id="businessWebsite"
                {...form.register("businessWebsite")}
                placeholder="https://example.com"
              />
              {form.formState.errors.businessWebsite && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.businessWebsite.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showBusinessInfo"
              {...form.register("showBusinessInfo")}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="showBusinessInfo" className="font-normal">
              Show business info on receipts
            </Label>
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
