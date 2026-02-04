"use client";

import { MapPin, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocations } from "@/hooks/use-locations";
import type { Settings } from "@/types";

interface DefaultLocationFormProps {
  settings: Settings;
  onLocationChange: (locationId: string | null) => void;
  isLoading?: boolean;
}

export function DefaultLocationForm({
  settings,
  onLocationChange,
  isLoading,
}: DefaultLocationFormProps) {
  const { data: locations, isLoading: locationsLoading } = useLocations({ isActive: true });

  const selectedLocation = locations?.find((l) => l.id === settings.defaultLocationId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Receipt Location
        </CardTitle>
        <CardDescription>
          Select the default location to display on receipts. If set, the location&apos;s name and
          address will appear instead of the business info above.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultLocation">Default Location</Label>
            {locationsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading locations...
              </div>
            ) : (
              <Select
                value={settings.defaultLocationId ?? "none"}
                onValueChange={(value) => {
                  onLocationChange(value === "none" ? null : value);
                }}
                disabled={isLoading}
              >
                <SelectTrigger id="defaultLocation">
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Use business info (no location)</span>
                  </SelectItem>
                  {locations?.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedLocation && (
            <div className="rounded-lg border bg-muted/50 p-3 text-sm">
              <p className="font-medium">{selectedLocation.name}</p>
              <p className="text-muted-foreground">{selectedLocation.address}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedLocation.timezone} · {selectedLocation.currency}
              </p>
            </div>
          )}

          {!locations?.length && !locationsLoading && (
            <p className="text-sm text-muted-foreground">
              No locations configured.{" "}
              <a href="/locations" className="text-primary hover:underline">
                Add a location
              </a>{" "}
              to use location-specific receipt headers.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
