"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from "@/lib/firestore/users";
import type { User } from "@/types";

interface PermissionsDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (permissions: string[]) => void | Promise<void>;
  isLoading?: boolean;
}

const PERMISSION_GROUPS = {
  Inventory: [
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_EDIT,
    PERMISSIONS.INVENTORY_DELETE,
  ],
  Sales: [
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_VOID,
    PERMISSIONS.SALES_REFUND,
  ],
  Reports: [
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
  ],
  Users: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_DELETE,
  ],
  Settings: [
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_EDIT,
  ],
  Locations: [
    PERMISSIONS.LOCATIONS_VIEW,
    PERMISSIONS.LOCATIONS_CREATE,
    PERMISSIONS.LOCATIONS_EDIT,
    PERMISSIONS.LOCATIONS_DELETE,
  ],
};

const PERMISSION_LABELS: Record<string, string> = {
  [PERMISSIONS.INVENTORY_VIEW]: "View inventory",
  [PERMISSIONS.INVENTORY_CREATE]: "Add products",
  [PERMISSIONS.INVENTORY_EDIT]: "Edit products",
  [PERMISSIONS.INVENTORY_DELETE]: "Delete products",
  [PERMISSIONS.SALES_VIEW]: "View sales",
  [PERMISSIONS.SALES_VOID]: "Void sales",
  [PERMISSIONS.SALES_REFUND]: "Process refunds",
  [PERMISSIONS.REPORTS_VIEW]: "View reports",
  [PERMISSIONS.REPORTS_EXPORT]: "Export reports",
  [PERMISSIONS.USERS_VIEW]: "View users",
  [PERMISSIONS.USERS_CREATE]: "Add users",
  [PERMISSIONS.USERS_EDIT]: "Edit users",
  [PERMISSIONS.USERS_DELETE]: "Delete users",
  [PERMISSIONS.SETTINGS_VIEW]: "View settings",
  [PERMISSIONS.SETTINGS_EDIT]: "Edit settings",
  [PERMISSIONS.LOCATIONS_VIEW]: "View locations",
  [PERMISSIONS.LOCATIONS_CREATE]: "Add locations",
  [PERMISSIONS.LOCATIONS_EDIT]: "Edit locations",
  [PERMISSIONS.LOCATIONS_DELETE]: "Delete locations",
};

export function PermissionsDialog({
  user,
  open,
  onOpenChange,
  onSave,
  isLoading,
}: PermissionsDialogProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (user) {
      setSelectedPermissions(new Set(user.permissions));
    }
  }, [user]);

  const togglePermission = (permission: string) => {
    const newPermissions = new Set(selectedPermissions);
    if (newPermissions.has(permission)) {
      newPermissions.delete(permission);
    } else {
      newPermissions.add(permission);
    }
    setSelectedPermissions(newPermissions);
  };

  const resetToRoleDefaults = () => {
    if (user) {
      setSelectedPermissions(new Set(DEFAULT_ROLE_PERMISSIONS[user.role]));
    }
  };

  const handleSave = () => {
    onSave(Array.from(selectedPermissions));
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Permissions</DialogTitle>
          <div className="flex items-center gap-2 pt-2">
            <span className="text-sm text-muted-foreground">
              {user.displayName}
            </span>
            <Badge variant="secondary" className="capitalize">
              {user.role}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Customize permissions for this user, or use role defaults.
            </p>
            <Button variant="outline" size="sm" onClick={resetToRoleDefaults}>
              Reset to Defaults
            </Button>
          </div>

          <Separator />

          {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => (
            <div key={group} className="space-y-2">
              <Label className="text-sm font-medium">{group}</Label>
              <div className="grid grid-cols-2 gap-2">
                {permissions.map((permission) => {
                  const isSelected = selectedPermissions.has(permission);
                  return (
                    <button
                      key={permission}
                      type="button"
                      onClick={() => togglePermission(permission)}
                      className={`flex items-center gap-2 rounded-md border p-2 text-left text-sm transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted hover:border-muted-foreground/50"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded border flex items-center justify-center ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <span>{PERMISSION_LABELS[permission]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Permissions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
