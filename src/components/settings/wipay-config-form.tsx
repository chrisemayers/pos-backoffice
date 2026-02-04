"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Loader2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { Settings } from "@/types";

interface WiPayFormData {
  wipayPublicKey: string;
  wipaySecretKey: string;
}

interface WiPayConfigFormProps {
  settings: Settings;
  onSubmit: (data: WiPayFormData) => Promise<void>;
  isLoading?: boolean;
}

export function WiPayConfigForm({ settings, onSubmit, isLoading }: WiPayConfigFormProps) {
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          WiPay Configuration
        </CardTitle>
        <CardDescription>
          Configure WiPay payment gateway integration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
      </CardContent>
    </Card>
  );
}
