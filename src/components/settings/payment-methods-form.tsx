"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Banknote, Smartphone, Loader2 } from "lucide-react";
import type { Settings } from "@/types";

const paymentMethods = [
  { id: "cash", label: "Cash", icon: Banknote, description: "Accept cash payments" },
  { id: "card", label: "Card", icon: CreditCard, description: "Accept credit/debit cards" },
  { id: "google_pay", label: "Google Pay", icon: Smartphone, description: "Accept Google Pay" },
];

interface PaymentMethodsFormProps {
  settings: Settings;
  onSubmit: (acceptedPaymentMethodIds: string[]) => Promise<void>;
  isLoading?: boolean;
}

export function PaymentMethodsForm({ settings, onSubmit, isLoading }: PaymentMethodsFormProps) {
  const [selected, setSelected] = useState<string[]>(settings.acceptedPaymentMethodIds);
  const [hasChanges, setHasChanges] = useState(false);

  const toggleMethod = (id: string) => {
    setSelected((prev) => {
      const newSelection = prev.includes(id)
        ? prev.filter((m) => m !== id)
        : [...prev, id];
      setHasChanges(true);
      return newSelection;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(selected);
    setHasChanges(false);
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

              return (
                <div
                  key={method.id}
                  className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  }`}
                  onClick={() => toggleMethod(method.id)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleMethod(method.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="flex-1">
                    <Label className="cursor-pointer font-medium">{method.label}</Label>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
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
