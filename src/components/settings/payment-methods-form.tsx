"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Banknote, Smartphone, Loader2, Wallet, AlertCircle } from "lucide-react";
import type { Settings } from "@/types";

interface PaymentMethod {
  id: string;
  label: string;
  icon: typeof CreditCard;
  description: string;
  requiresConfig?: boolean;
  configCheck?: (settings: Settings) => boolean;
  configMessage?: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "cash",
    label: "Cash",
    icon: Banknote,
    description: "Accept cash payments",
  },
  {
    id: "card",
    label: "Card (Manual)",
    icon: CreditCard,
    description: "Accept card payments via external terminal",
  },
  {
    id: "stripe",
    label: "Stripe",
    icon: CreditCard,
    description: "Accept card payments via Stripe",
    requiresConfig: true,
    configCheck: (settings) => !!settings.stripePublishableKey,
    configMessage: "Configure Stripe in Payment Configuration to enable",
  },
  {
    id: "google_pay",
    label: "Google Pay",
    icon: Smartphone,
    description: "Accept Google Pay payments",
    requiresConfig: true,
    configCheck: (settings) => !!settings.gpayMerchantName && !!settings.gpayMerchantId,
    configMessage: "Configure Google Pay in Payment Configuration to enable",
  },
  {
    id: "wipay",
    label: "WiPay",
    icon: Wallet,
    description: "Accept payments via WiPay",
    requiresConfig: true,
    configCheck: (settings) => !!settings.wipayPublicKey,
    configMessage: "Configure WiPay in Payment Configuration to enable",
  },
];

interface PaymentMethodsFormProps {
  settings: Settings;
  onSubmit: (acceptedPaymentMethodIds: string[]) => Promise<void>;
  isLoading?: boolean;
}

export function PaymentMethodsForm({ settings, onSubmit, isLoading }: PaymentMethodsFormProps) {
  const [selected, setSelected] = useState<string[]>(settings.acceptedPaymentMethodIds);
  const [hasChanges, setHasChanges] = useState(false);

  const toggleMethod = (method: PaymentMethod) => {
    if (method.requiresConfig && method.configCheck && !method.configCheck(settings)) {
      return;
    }

    setSelected((prev) => {
      const newSelection = prev.includes(method.id)
        ? prev.filter((m) => m !== method.id)
        : [...prev, method.id];
      setHasChanges(true);
      return newSelection;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(selected);
    setHasChanges(false);
  };

  const isMethodConfigured = (method: PaymentMethod): boolean => {
    if (!method.requiresConfig) return true;
    if (!method.configCheck) return true;
    return method.configCheck(settings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Methods
        </CardTitle>
        <CardDescription>
          Select which payment methods to accept at checkout
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = selected.includes(method.id);
              const isConfigured = isMethodConfigured(method);
              const isDisabled = !isConfigured;

              return (
                <div
                  key={method.id}
                  className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${
                    isDisabled
                      ? "border-border bg-muted/50 cursor-not-allowed opacity-60"
                      : isSelected
                        ? "border-primary bg-primary/5 cursor-pointer"
                        : "border-border hover:border-muted-foreground cursor-pointer"
                  }`}
                  onClick={() => !isDisabled && toggleMethod(method)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => !isDisabled && toggleMethod(method)}
                    className="h-4 w-4 rounded border-gray-300 disabled:cursor-not-allowed"
                  />
                  <Icon
                    className={`h-5 w-5 ${
                      isDisabled
                        ? "text-muted-foreground"
                        : isSelected
                          ? "text-primary"
                          : "text-muted-foreground"
                    }`}
                  />
                  <div className="flex-1">
                    <Label
                      className={`font-medium ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {method.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                    {isDisabled && method.configMessage && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {method.configMessage}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selected.length === 0 && (
            <p className="text-sm text-amber-600">
              You must select at least one payment method
            </p>
          )}

          <Button type="submit" disabled={isLoading || !hasChanges || selected.length === 0}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
