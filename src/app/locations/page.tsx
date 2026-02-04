"use client";

import { useState } from "react";
import { Plus, Search, Building2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocationTable } from "@/components/locations/location-table";
import { LocationForm, type LocationFormSubmitData } from "@/components/locations/location-form";
import {
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
  useDeactivateLocation,
  useReactivateLocation,
} from "@/hooks/use-locations";
import { useCurrentUser, PERMISSIONS } from "@/hooks/use-current-user";
import type { Location } from "@/types";

export default function LocationsPage() {
  const [search, setSearch] = useState("");
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  // Permission checks
  const { hasPermission, isAdmin } = useCurrentUser();
  const canCreateLocations = hasPermission(PERMISSIONS.LOCATIONS_CREATE);
  const canEditLocations = hasPermission(PERMISSIONS.LOCATIONS_EDIT);
  const canDeleteLocations = hasPermission(PERMISSIONS.LOCATIONS_DELETE);

  // Queries
  const { data: locations = [], isLoading } = useLocations({
    search: search || undefined,
    isActive: activeTab === "active" ? true : activeTab === "inactive" ? false : undefined,
  });

  // Mutations
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const deleteMutation = useDeleteLocation();
  const deactivateMutation = useDeactivateLocation();
  const reactivateMutation = useReactivateLocation();

  // Filter locations by tab
  const filteredLocations = locations.filter((l) =>
    activeTab === "inactive" ? !l.isActive : l.isActive
  );

  // Stats
  const activeLocations = locations.filter((l) => l.isActive);

  const handleCreate = async (data: LocationFormSubmitData) => {
    await createMutation.mutateAsync({
      name: data.name,
      address: data.address,
      timezone: data.timezone,
      currency: data.currency,
    });
    setIsCreating(false);
  };

  const handleUpdate = async (data: LocationFormSubmitData) => {
    if (!editingLocation) return;
    await updateMutation.mutateAsync({
      id: editingLocation.id,
      name: data.name,
      address: data.address,
      timezone: data.timezone,
      currency: data.currency,
    });
    setEditingLocation(null);
  };

  const handleDelete = async (location: Location) => {
    if (confirm(`Permanently delete "${location.name}"? This action cannot be undone.`)) {
      await deleteMutation.mutateAsync(location.id);
    }
  };

  const handleDeactivate = async (location: Location) => {
    if (confirm(`Deactivate "${location.name}"? It will no longer be available for assignments.`)) {
      await deactivateMutation.mutateAsync(location.id);
    }
  };

  const handleReactivate = async (location: Location) => {
    await reactivateMutation.mutateAsync(location.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
          <p className="text-muted-foreground">Manage your store locations</p>
        </div>
        {canCreateLocations && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLocations.length}</div>
            <p className="text-xs text-muted-foreground">Active locations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regions</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(activeLocations.map((l) => l.timezone)).size}
            </div>
            <p className="text-xs text-muted-foreground">Unique timezones</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="active">Active Locations</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search locations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-[250px] pl-9"
                  />
                </div>
              </div>
            </div>

            <TabsContent value="active" className="mt-4">
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading locations...
                </div>
              ) : (
                <LocationTable
                  locations={filteredLocations}
                  onEdit={canEditLocations ? setEditingLocation : undefined}
                  onDeactivate={canEditLocations ? handleDeactivate : undefined}
                  onReactivate={canEditLocations ? handleReactivate : undefined}
                  onDelete={canDeleteLocations ? handleDelete : undefined}
                  canEdit={canEditLocations}
                  canDelete={canDeleteLocations}
                />
              )}
            </TabsContent>

            <TabsContent value="inactive" className="mt-4">
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading inactive locations...
                </div>
              ) : (
                <LocationTable
                  locations={filteredLocations}
                  onEdit={canEditLocations ? setEditingLocation : undefined}
                  onDeactivate={canEditLocations ? handleDeactivate : undefined}
                  onReactivate={canEditLocations ? handleReactivate : undefined}
                  onDelete={canDeleteLocations ? handleDelete : undefined}
                  canEdit={canEditLocations}
                  canDelete={canDeleteLocations}
                  showInactive
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
            <DialogTitle>Add Location</DialogTitle>
          </DialogHeader>
          <LocationForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreating(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingLocation} onOpenChange={() => setEditingLocation(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
          </DialogHeader>
          {editingLocation && (
            <LocationForm
              location={editingLocation}
              onSubmit={handleUpdate}
              onCancel={() => setEditingLocation(null)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
