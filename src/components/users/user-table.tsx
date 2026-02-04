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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  UserX,
  UserCheck,
  Trash2,
  Shield,
} from "lucide-react";
import type { User } from "@/types";

interface UserTableProps {
  users: User[];
  onEdit?: (user: User) => void;
  onDeactivate?: (user: User) => void;
  onReactivate?: (user: User) => void;
  onDelete?: (user: User) => void;
  onManagePermissions?: (user: User) => void;
  showInactive?: boolean;
  // Permission flags to control which actions are shown
  canEdit?: boolean;
  canDelete?: boolean;
  canManagePermissions?: boolean;
}

const roleBadgeVariants: Record<User["role"], "default" | "secondary" | "outline"> = {
  admin: "default",
  manager: "secondary",
  cashier: "outline",
};

export function UserTable({
  users,
  onEdit,
  onDeactivate,
  onReactivate,
  onDelete,
  onManagePermissions,
  showInactive = false,
  canEdit = true,
  canDelete = true,
  canManagePermissions = true,
}: UserTableProps) {
  const getUserInitials = (user: User) => {
    if (user.displayName) {
      return user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  const formatDate = (date?: Date) => {
    if (!date) return "Never";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  if (users.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {showInactive ? "No inactive employees" : "No employees found"}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Locations</TableHead>
          <TableHead>Last Login</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id} className={!user.isActive ? "opacity-60" : ""}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs">
                    {getUserInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{user.displayName}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={roleBadgeVariants[user.role]} className="capitalize">
                {user.role}
              </Badge>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {user.locationIds.length} location{user.locationIds.length !== 1 ? "s" : ""}
              </span>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDate(user.lastLogin)}
            </TableCell>
            <TableCell>
              <Badge variant={user.isActive ? "default" : "secondary"}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
            <TableCell>
              {(canEdit || canDelete || canManagePermissions) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit && onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(user)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {canManagePermissions && onManagePermissions && (
                      <DropdownMenuItem onClick={() => onManagePermissions(user)}>
                        <Shield className="mr-2 h-4 w-4" />
                        Permissions
                      </DropdownMenuItem>
                    )}
                    {(canEdit || canDelete) && (canEdit || canManagePermissions) && (
                      <DropdownMenuSeparator />
                    )}
                    {canEdit && user.isActive && onDeactivate && (
                      <DropdownMenuItem
                        onClick={() => onDeactivate(user)}
                        className="text-amber-600"
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Deactivate
                      </DropdownMenuItem>
                    )}
                    {canEdit && !user.isActive && onReactivate && (
                      <DropdownMenuItem onClick={() => onReactivate(user)}>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Reactivate
                      </DropdownMenuItem>
                    )}
                    {canDelete && onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(user)}
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
