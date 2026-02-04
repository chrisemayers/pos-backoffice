"use client";

import { useState } from "react";
import { Plus, Search, Filter, Users, UserCheck, UserX, Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserTable } from "@/components/users/user-table";
import { UserForm, type UserFormSubmitData } from "@/components/users/user-form";
import { PermissionsDialog } from "@/components/users/permissions-dialog";
import { InviteUserDialog } from "@/components/users/invite-user-dialog";
import { InvitationsTable } from "@/components/users/invitations-table";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useDeactivateUser,
  useReactivateUser,
  useUpdateUserPermissions,
} from "@/hooks/use-users";
import {
  useInvitations,
  useRevokeInvitation,
  useResendInvitation,
  useDeleteInvitation,
} from "@/hooks/use-invitations";
import { useCurrentUser, PERMISSIONS } from "@/hooks/use-current-user";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/firestore/users";
import type { Invitation } from "@/lib/firestore/invitations";
import type { User } from "@/types";

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null);

  // Permission checks
  const { hasPermission, isAdmin } = useCurrentUser();
  const canCreateUsers = hasPermission(PERMISSIONS.USERS_CREATE);
  const canEditUsers = hasPermission(PERMISSIONS.USERS_EDIT);
  const canDeleteUsers = hasPermission(PERMISSIONS.USERS_DELETE);

  // Queries
  const { data: users = [], isLoading } = useUsers({
    search: search || undefined,
    role: roleFilter !== "all" ? (roleFilter as User["role"]) : undefined,
    isActive: activeTab === "active" ? true : activeTab === "inactive" ? false : undefined,
  });

  const { data: invitations = [], isLoading: isLoadingInvitations } = useInvitations();

  // Mutations
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const deactivateMutation = useDeactivateUser();
  const reactivateMutation = useReactivateUser();
  const updatePermissionsMutation = useUpdateUserPermissions();
  const revokeInvitationMutation = useRevokeInvitation();
  const resendInvitationMutation = useResendInvitation();
  const deleteInvitationMutation = useDeleteInvitation();

  // Filter users by tab
  const filteredUsers = users.filter((u) =>
    activeTab === "inactive" ? !u.isActive : u.isActive
  );

  // Filter invitations - only show pending for the invitations tab
  const pendingInvitations = invitations.filter((i) => i.status === "pending");

  // Stats
  const activeUsers = users.filter((u) => u.isActive);
  const adminCount = activeUsers.filter((u) => u.role === "admin").length;
  const managerCount = activeUsers.filter((u) => u.role === "manager").length;
  const cashierCount = activeUsers.filter((u) => u.role === "cashier").length;

  const handleCreate = async (data: UserFormSubmitData) => {
    await createMutation.mutateAsync({
      displayName: data.displayName,
      email: data.email,
      role: data.role,
      permissions: DEFAULT_ROLE_PERMISSIONS[data.role],
      locationIds: [],
    });
    setIsCreating(false);
  };

  const handleUpdate = async (data: UserFormSubmitData) => {
    if (!editingUser) return;
    await updateMutation.mutateAsync({
      id: editingUser.id,
      displayName: data.displayName,
      role: data.role,
    });
    setEditingUser(null);
  };

  const handleDelete = async (user: User) => {
    if (confirm(`Permanently delete "${user.displayName}"? This action cannot be undone.`)) {
      await deleteMutation.mutateAsync(user.id);
    }
  };

  const handleDeactivate = async (user: User) => {
    if (confirm(`Deactivate "${user.displayName}"? They will no longer be able to access the system.`)) {
      await deactivateMutation.mutateAsync(user.id);
    }
  };

  const handleReactivate = async (user: User) => {
    await reactivateMutation.mutateAsync(user.id);
  };

  const handleSavePermissions = async (permissions: string[]) => {
    if (!permissionsUser) return;
    await updatePermissionsMutation.mutateAsync({
      id: permissionsUser.id,
      permissions,
    });
    setPermissionsUser(null);
  };

  const handleRevokeInvitation = async (invitation: Invitation) => {
    if (confirm(`Revoke invitation for "${invitation.email}"?`)) {
      await revokeInvitationMutation.mutateAsync(invitation.id);
    }
  };

  const handleResendInvitation = async (invitation: Invitation) => {
    await resendInvitationMutation.mutateAsync(invitation.id);
  };

  const handleDeleteInvitation = async (invitation: Invitation) => {
    if (confirm(`Delete invitation for "${invitation.email}"?`)) {
      await deleteInvitationMutation.mutateAsync(invitation.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">Manage your team members and their access</p>
        </div>
        {canCreateUsers && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsInviting(true)}>
              <Mail className="mr-2 h-4 w-4" />
              Invite
            </Button>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers.length}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
            <p className="text-xs text-muted-foreground">Full access</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{managerCount}</div>
            <p className="text-xs text-muted-foreground">Inventory & reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cashiers</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cashierCount}</div>
            <p className="text-xs text-muted-foreground">Sales only</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="active">Active Employees</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
                <TabsTrigger value="invitations">
                  Invitations
                  {pendingInvitations.length > 0 && (
                    <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      {pendingInvitations.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {activeTab !== "invitations" && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search employees..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-[250px] pl-9"
                    />
                  </div>

                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[150px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="cashier">Cashier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <TabsContent value="active" className="mt-4">
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading employees...
                </div>
              ) : (
                <UserTable
                  users={filteredUsers}
                  onEdit={canEditUsers ? setEditingUser : undefined}
                  onDeactivate={canEditUsers ? handleDeactivate : undefined}
                  onReactivate={canEditUsers ? handleReactivate : undefined}
                  onDelete={canDeleteUsers ? handleDelete : undefined}
                  onManagePermissions={isAdmin ? setPermissionsUser : undefined}
                  canEdit={canEditUsers}
                  canDelete={canDeleteUsers}
                  canManagePermissions={isAdmin}
                />
              )}
            </TabsContent>

            <TabsContent value="inactive" className="mt-4">
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading inactive employees...
                </div>
              ) : (
                <UserTable
                  users={filteredUsers}
                  onEdit={canEditUsers ? setEditingUser : undefined}
                  onDeactivate={canEditUsers ? handleDeactivate : undefined}
                  onReactivate={canEditUsers ? handleReactivate : undefined}
                  onDelete={canDeleteUsers ? handleDelete : undefined}
                  onManagePermissions={isAdmin ? setPermissionsUser : undefined}
                  canEdit={canEditUsers}
                  canDelete={canDeleteUsers}
                  canManagePermissions={isAdmin}
                  showInactive
                />
              )}
            </TabsContent>

            <TabsContent value="invitations" className="mt-4">
              {isLoadingInvitations ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading invitations...
                </div>
              ) : (
                <InvitationsTable
                  invitations={invitations}
                  onResend={handleResendInvitation}
                  onRevoke={handleRevokeInvitation}
                  onDelete={handleDeleteInvitation}
                  canManage={canCreateUsers}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
          </DialogHeader>
          <UserForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreating(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <UserForm
              user={editingUser}
              onSubmit={handleUpdate}
              onCancel={() => setEditingUser(null)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <PermissionsDialog
        user={permissionsUser}
        open={!!permissionsUser}
        onOpenChange={() => setPermissionsUser(null)}
        onSave={handleSavePermissions}
        isLoading={updatePermissionsMutation.isPending}
      />

      {/* Invite Dialog */}
      <InviteUserDialog
        open={isInviting}
        onOpenChange={setIsInviting}
      />
    </div>
  );
}
