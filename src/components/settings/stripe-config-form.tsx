"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2 } from "lucide-react";
import type { Settings } from "@/types";

interface StripeFormData {
  stripePublishableKey: string;
}

interface StripeConfigFormProps {
  settings: Settings;
  onSubmit: (data: StripeFormData) => Promise<void>;
  isLoading?: boolean;
}

export function StripeConfigForm({ settings, onSubmit, isLoading }: StripeConfigFormProps) {
  const form = useForm<StripeFormData>({
    defaultValues: {
      stripePublishableKey: settings.stripePublishableKey || "",
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  const publishableKey = form.watch("stripePublishableKey");
  const isValidFormat = !publishableKey || publishableKey.startsWith("pk_test_") || publishableKey.startsWith("pk_live_");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-5 w-5" />
        <h3 className="font-medium">Stripe Configuration</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Configure Stripe payment gateway for card processing
      </p>

      <div className="space-y-2">
        <Label htmlFor="stripePublishableKey">Publishable Key</Label>
        <Input
          id="stripePublishableKey"
          placeholder="pk_test_... or pk_live_..."
          {...form.register("stripePublishableKey")}
        />
        {!isValidFormat && (
          <p className="text-xs text-destructive">
            Key should start with pk_test_ or pk_live_
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Your Stripe publishable key (starts with pk_)
        </p>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !form.formState.isDirty || !isValidFormat}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </form>
  );
}
