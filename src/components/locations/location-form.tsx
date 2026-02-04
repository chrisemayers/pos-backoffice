"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMMON_TIMEZONES, COMMON_CURRENCIES } from "@/lib/firestore/locations";
import type { Location } from "@/types";

const locationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  timezone: z.string().min(1, "Timezone is required"),
  currency: z.string().min(1, "Currency is required"),
});

type LocationFormData = z.infer<typeof locationSchema>;

export interface LocationFormSubmitData {
  name: string;
  address: string;
  timezone: string;
  currency: string;
}

interface LocationFormProps {
  location?: Location;
  onSubmit: (data: LocationFormSubmitData) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function LocationForm({ location, onSubmit, onCancel, isLoading }: LocationFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema) as any,
    mode: "onChange",
    defaultValues: {
      name: location?.name ?? "",
      address: location?.address ?? "",
      timezone: location?.timezone ?? "America/New_York",
      currency: location?.currency ?? "USD",
    },
  });

  const currentTimezone = watch("timezone");
  const currentCurrency = watch("currency");

  const handleFormSubmit = (data: LocationFormData) => {
    onSubmit({
      name: data.name,
      address: data.address,
      timezone: data.timezone,
      currency: data.currency,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Location Name *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="e.g., Main Store, Downtown Branch"
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          {...register("address")}
          placeholder="123 Main Street, City, State ZIP"
        />
        {errors.address && (
          <p className="text-sm text-red-500">{errors.address.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone *</Label>
        <Select
          value={currentTimezone}
          onValueChange={(value) => setValue("timezone", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {COMMON_TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.timezone && (
          <p className="text-sm text-red-500">{errors.timezone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency *</Label>
        <Select
          value={currentCurrency}
          onValueChange={(value) => setValue("currency", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {COMMON_CURRENCIES.map((curr) => (
              <SelectItem key={curr.value} value={curr.value}>
                {curr.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.currency && (
          <p className="text-sm text-red-500">{errors.currency.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : location ? "Update Location" : "Add Location"}
        </Button>
      </div>
    </form>
  );
}
