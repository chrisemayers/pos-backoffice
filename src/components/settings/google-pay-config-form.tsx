"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Loader2 } from "lucide-react";
import type { Settings } from "@/types";

interface GooglePayFormData {
  gpayMerchantName: string;
  gpayMerchantId: string;
  gpayGateway: string;
  gpayGatewayMerchantId: string;
  gpayEnvironment: "TEST" | "PRODUCTION" | "";
  gpayGatewayParamsJson: string;
}

interface GooglePayConfigFormProps {
  settings: Settings;
  onSubmit: (data: GooglePayFormData) => Promise<void>;
  isLoading?: boolean;
}

export function GooglePayConfigForm({ settings, onSubmit, isLoading }: GooglePayConfigFormProps) {
  const form = useForm<GooglePayFormData>({
    defaultValues: {
      gpayMerchantName: settings.gpayMerchantName || "",
      gpayMerchantId: settings.gpayMerchantId || "",
      gpayGateway: settings.gpayGateway || "",
      gpayGatewayMerchantId: settings.gpayGatewayMerchantId || "",
      gpayEnvironment: settings.gpayEnvironment || "",
      gpayGatewayParamsJson: settings.gpayGatewayParamsJson || "",
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Google Pay Configuration
        </CardTitle>
        <CardDescription>
          Configure Google Pay integration for mobile payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gpayMerchantName">Merchant Name</Label>
              <Input
                id="gpayMerchantName"
                placeholder="Your Business Name"
                {...form.register("gpayMerchantName")}
              />
              <p className="text-xs text-muted-foreground">
                Display name shown to customers
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gpayMerchantId">Merchant ID</Label>
              <Input
                id="gpayMerchantId"
                placeholder="BCR2DN..."
                {...form.register("gpayMerchantId")}
              />
              <p className="text-xs text-muted-foreground">
                From Google Pay Business Console (production)
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gpayGateway">Gateway</Label>
              <Input
                id="gpayGateway"
                placeholder="stripe, braintree, etc."
                {...form.register("gpayGateway")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gpayGatewayMerchantId">Gateway Merchant ID</Label>
              <Input
                id="gpayGatewayMerchantId"
                placeholder="Your gateway merchant ID"
                {...form.register("gpayGatewayMerchantId")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gpayEnvironment">Environment</Label>
            <select
              id="gpayEnvironment"
              {...form.register("gpayEnvironment")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Default (TEST in debug, PRODUCTION in release)</option>
              <option value="TEST">TEST</option>
              <option value="PRODUCTION">PRODUCTION</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gpayGatewayParamsJson">Gateway Extra Parameters (JSON)</Label>
            <Input
              id="gpayGatewayParamsJson"
              placeholder='{"key": "value"}'
              {...form.register("gpayGatewayParamsJson")}
            />
            <p className="text-xs text-muted-foreground">
              Optional additional gateway-specific parameters
            </p>
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
