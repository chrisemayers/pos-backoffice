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
import { useLocations } from "@/hooks/use-locations";
import type { User } from "@/types";

const userSchema = z.object({
  displayName: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "manager", "cashier"]),
  defaultLocationId: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

export interface UserFormSubmitData {
  displayName: string;
  email: string;
  role: User["role"];
  defaultLocationId?: string;
}

interface UserFormProps {
  user?: User;
  onSubmit: (data: UserFormSubmitData) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function UserForm({ user, onSubmit, onCancel, isLoading }: UserFormProps) {
  const { data: locations = [] } = useLocations({ isActive: true });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema) as any,
    mode: "onChange",
    defaultValues: {
      displayName: user?.displayName ?? "",
      email: user?.email ?? "",
      role: user?.role ?? "cashier",
      defaultLocationId: user?.defaultLocationId ?? "",
    },
  });

  const currentRole = watch("role");
  const currentDefaultLocation = watch("defaultLocationId");

  const handleFormSubmit = (data: UserFormData) => {
    onSubmit({
      displayName: data.displayName,
      email: data.email,
      role: data.role,
      defaultLocationId: data.defaultLocationId || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">Full Name *</Label>
        <Input
          id="displayName"
          {...register("displayName")}
          placeholder="Enter employee name"
        />
        {errors.displayName && (
          <p className="text-sm text-red-500">{errors.displayName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder="employee@company.com"
          disabled={!!user}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
        {user && (
          <p className="text-xs text-muted-foreground">
            Email cannot be changed after creation
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role *</Label>
        <Select
          value={currentRole}
          onValueChange={(value: User["role"]) => setValue("role", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">
              <div className="flex flex-col">
                <span>Admin</span>
                <span className="text-xs text-muted-foreground">
                  Full access to all features
                </span>
              </div>
            </SelectItem>
            <SelectItem value="manager">
              <div className="flex flex-col">
                <span>Manager</span>
                <span className="text-xs text-muted-foreground">
                  Manage inventory, view reports
                </span>
              </div>
            </SelectItem>
            <SelectItem value="cashier">
              <div className="flex flex-col">
                <span>Cashier</span>
                <span className="text-xs text-muted-foreground">
                  Process sales only
                </span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-red-500">{errors.role.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultLocationId">Default Location (for POS App)</Label>
        <Select
          value={currentDefaultLocation || ""}
          onValueChange={(value) => setValue("defaultLocationId", value === "none" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a default location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <span className="text-muted-foreground">No default location</span>
            </SelectItem>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          This location will be used by the Android POS app for this user&apos;s sessions
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : user ? "Update Employee" : "Add Employee"}
        </Button>
      </div>
    </form>
  );
}
