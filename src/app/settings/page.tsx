"use client";

import { Settings as SettingsIcon, AlertTriangle, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { BusinessInfoForm } from "@/components/settings/business-info-form";
import { TaxSettingsForm } from "@/components/settings/tax-settings-form";
import { PaymentMethodsForm } from "@/components/settings/payment-methods-form";
import { GooglePayConfigForm } from "@/components/settings/google-pay-config-form";
import { WiPayConfigForm } from "@/components/settings/wipay-config-form";
import { DefaultLocationForm } from "@/components/settings/default-location-form";
import {
  useSettings,
  useUpdateBusinessInfo,
  useUpdateTaxSettings,
  useUpdatePaymentMethods,
  useUpdateStockAlertSettings,
  useUpdateGooglePayConfig,
  useUpdateWiPayConfig,
  useUpdateDefaultLocation,
} from "@/hooks/use-settings";

export default function SettingsPage() {
  const { data: settings, isLoading, error } = useSettings();

  const businessInfoMutation = useUpdateBusinessInfo();
  const taxMutation = useUpdateTaxSettings();
  const paymentMutation = useUpdatePaymentMethods();
  const stockAlertMutation = useUpdateStockAlertSettings();
  const googlePayMutation = useUpdateGooglePayConfig();
  const wipayMutation = useUpdateWiPayConfig();
  const defaultLocationMutation = useUpdateDefaultLocation();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your store configuration</p>
        </div>
        <div className="py-12 text-center text-muted-foreground">
          Loading settings...
        </div>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your store configuration</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6">
            <p className="text-red-600">Failed to load settings. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your store configuration</p>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Business Info */}
        <BusinessInfoForm
          settings={settings}
          onSubmit={async (data) => {
            await businessInfoMutation.mutateAsync(data);
          }}
          isLoading={businessInfoMutation.isPending}
        />

        {/* Default Location for Receipts */}
        <DefaultLocationForm
          settings={settings}
          onLocationChange={(locationId) => {
            defaultLocationMutation.mutate(locationId);
          }}
          isLoading={defaultLocationMutation.isPending}
        />

        {/* Tax Settings */}
        <TaxSettingsForm
          settings={settings}
          onSubmit={async (data) => {
            await taxMutation.mutateAsync(data);
          }}
          isLoading={taxMutation.isPending}
        />

        {/* Payment Methods */}
        <PaymentMethodsForm
          settings={settings}
          onSubmit={async (ids) => {
            await paymentMutation.mutateAsync(ids);
          }}
          isLoading={paymentMutation.isPending}
        />

        {/* Google Pay Configuration */}
        <GooglePayConfigForm
          settings={settings}
          onSubmit={async (data) => {
            await googlePayMutation.mutateAsync(data);
          }}
          isLoading={googlePayMutation.isPending}
        />

        {/* WiPay Configuration */}
        <WiPayConfigForm
          settings={settings}
          onSubmit={async (data) => {
            await wipayMutation.mutateAsync(data);
          }}
          isLoading={wipayMutation.isPending}
        />

        {/* Device Settings (Read-only - managed on POS device) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Device Settings
            </CardTitle>
            <CardDescription>
              These settings are configured on individual POS devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Receipt Sharing</span>
                <span className={settings.receiptSharingEnabled ? "text-green-600" : "text-muted-foreground"}>
                  {settings.receiptSharingEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Printer</span>
                <span className={settings.printerEnabled ? "text-green-600" : "text-muted-foreground"}>
                  {settings.printerEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Printer and receipt options are configured in the Settings screen on each POS device.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Inventory Alerts
            </CardTitle>
            <CardDescription>
              Configure low stock notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="stockAlerts"
                  checked={settings.stockLevelAlertsEnabled}
                  onChange={(e) => stockAlertMutation.mutate(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div>
                  <Label htmlFor="stockAlerts">Enable low stock alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications when products fall below their alert level
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Regional Settings
            </CardTitle>
            <CardDescription>
              Currency and locale configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <span className="text-2xl">$</span>
                  <div>
                    <p className="font-medium">{settings.currencyCode}</p>
                    <p className="text-sm text-muted-foreground">US Dollar</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Currency can only be changed by contacting support
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
