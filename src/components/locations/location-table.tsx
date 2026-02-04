"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Pencil,
  Building2,
  MapPin,
  Trash2,
  Power,
  PowerOff,
} from "lucide-react";
import type { Location } from "@/types";

interface LocationTableProps {
  locations: Location[];
  onEdit?: (location: Location) => void;
  onDeactivate?: (location: Location) => void;
  onReactivate?: (location: Location) => void;
  onDelete?: (location: Location) => void;
  showInactive?: boolean;
  // Permission flags to control which actions are shown
  canEdit?: boolean;
  canDelete?: boolean;
}

export function LocationTable({
  locations,
  onEdit,
  onDeactivate,
  onReactivate,
  onDelete,
  showInactive = false,
  canEdit = true,
  canDelete = true,
}: LocationTableProps) {
  if (locations.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {showInactive ? "No inactive locations" : "No locations found"}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Location</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Timezone</TableHead>
          <TableHead>Currency</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {locations.map((location) => (
          <TableRow key={location.id} className={!location.isActive ? "opacity-60" : ""}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="font-medium">{location.name}</div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {location.address || "No address"}
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {location.timezone}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{location.currency}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={location.isActive ? "default" : "secondary"}>
                {location.isActive ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
            <TableCell>
              {(canEdit || canDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit && onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(location)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {canEdit && <DropdownMenuSeparator />}
                    {canEdit && location.isActive && onDeactivate && (
                      <DropdownMenuItem
                        onClick={() => onDeactivate(location)}
                        className="text-amber-600"
                      >
                        <PowerOff className="mr-2 h-4 w-4" />
                        Deactivate
                      </DropdownMenuItem>
                    )}
                    {canEdit && !location.isActive && onReactivate && (
                      <DropdownMenuItem onClick={() => onReactivate(location)}>
                        <Power className="mr-2 h-4 w-4" />
                        Reactivate
                      </DropdownMenuItem>
                    )}
                    {canDelete && onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(location)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
