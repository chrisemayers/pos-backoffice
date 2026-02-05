"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StripeConfigForm } from "./stripe-config-form";
import { GooglePayConfigForm } from "./google-pay-config-form";
import { WiPayConfigForm } from "./wipay-config-form";
import { Check, X, CreditCard } from "lucide-react";
import type { Settings } from "@/types";

interface PaymentConfigTabsProps {
  settings: Settings;
  onStripeSubmit: (data: { stripePublishableKey: string }) => Promise<void>;
  onGooglePaySubmit: (data: {
    gpayMerchantName: string;
    gpayMerchantId: string;
    gpayGateway: string;
    gpayGatewayMerchantId: string;
    gpayEnvironment: "TEST" | "PRODUCTION" | "";
    gpayGatewayParamsJson: string;
  }) => Promise<void>;
  onWiPaySubmit: (data: { wipayPublicKey: string; wipaySecretKey: string }) => Promise<void>;
  isStripeLoading?: boolean;
  isGooglePayLoading?: boolean;
  isWiPayLoading?: boolean;
}

function ConfigStatus({ isConfigured }: { isConfigured: boolean }) {
  return isConfigured ? (
    <Check className="h-4 w-4 text-green-500" />
  ) : (
    <X className="h-4 w-4 text-muted-foreground" />
  );
}

export function PaymentConfigTabs({
  settings,
  onStripeSubmit,
  onGooglePaySubmit,
  onWiPaySubmit,
  isStripeLoading,
  isGooglePayLoading,
  isWiPayLoading,
}: PaymentConfigTabsProps) {
  const isStripeConfigured = !!settings?.stripePublishableKey;
  const isGooglePayConfigured = !!settings?.gpayMerchantName && !!settings?.gpayMerchantId;
  const isWiPayConfigured = !!settings?.wipayPublicKey;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Gateway Configuration
        </CardTitle>
        <CardDescription>
          Configure your payment gateway integrations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stripe">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="stripe" className="gap-2">
              Stripe
              <ConfigStatus isConfigured={isStripeConfigured} />
            </TabsTrigger>
            <TabsTrigger value="googlepay" className="gap-2">
              Google Pay
              <ConfigStatus isConfigured={isGooglePayConfigured} />
            </TabsTrigger>
            <TabsTrigger value="wipay" className="gap-2">
              WiPay
              <ConfigStatus isConfigured={isWiPayConfigured} />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stripe">
            <StripeConfigForm
              settings={settings}
              onSubmit={onStripeSubmit}
              isLoading={isStripeLoading}
            />
          </TabsContent>

          <TabsContent value="googlepay">
            <GooglePayInlineForm
              settings={settings}
              onSubmit={onGooglePaySubmit}
              isLoading={isGooglePayLoading}
            />
          </TabsContent>

          <TabsContent value="wipay">
            <WiPayInlineForm
              settings={settings}
              onSubmit={onWiPaySubmit}
              isLoading={isWiPayLoading}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Inline versions of Google Pay and WiPay forms (without Card wrapper)
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Smartphone, Wallet } from "lucide-react";
import { useState } from "react";

interface GooglePayFormData {
  gpayMerchantName: string;
  gpayMerchantId: string;
  gpayGateway: string;
  gpayGatewayMerchantId: string;
  gpayEnvironment: "TEST" | "PRODUCTION" | "";
  gpayGatewayParamsJson: string;
}

function GooglePayInlineForm({
  settings,
  onSubmit,
  isLoading,
}: {
  settings: Settings;
  onSubmit: (data: GooglePayFormData) => Promise<void>;
  isLoading?: boolean;
}) {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Smartphone className="h-5 w-5" />
        <h3 className="font-medium">Google Pay Configuration</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Configure Google Pay integration for mobile payments
      </p>

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
            From Google Pay Business Console
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
  );
}

interface WiPayFormData {
  wipayPublicKey: string;
  wipaySecretKey: string;
}

function WiPayInlineForm({
  settings,
  onSubmit,
  isLoading,
}: {
  settings: Settings;
  onSubmit: (data: WiPayFormData) => Promise<void>;
  isLoading?: boolean;
}) {
  const [showSecret, setShowSecret] = useState(false);

  const form = useForm<WiPayFormData>({
    defaultValues: {
      wipayPublicKey: settings.wipayPublicKey || "",
      wipaySecretKey: settings.wipaySecretKey || "",
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="h-5 w-5" />
        <h3 className="font-medium">WiPay Configuration</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Configure WiPay payment gateway integration
      </p>

      <div className="space-y-2">
        <Label htmlFor="wipayPublicKey">Public Key</Label>
        <Input
          id="wipayPublicKey"
          placeholder="pk_live_..."
          {...form.register("wipayPublicKey")}
        />
        <p className="text-xs text-muted-foreground">
          Your WiPay public/publishable key
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="wipaySecretKey">Secret Key</Label>
        <div className="relative">
          <Input
            id="wipaySecretKey"
            type={showSecret ? "text" : "password"}
            placeholder="sk_live_..."
            {...form.register("wipaySecretKey")}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Your WiPay secret key (keep this secure)
        </p>
      </div>

      <Button type="submit" disabled={isLoading || !form.formState.isDirty}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </form>
  );
}
