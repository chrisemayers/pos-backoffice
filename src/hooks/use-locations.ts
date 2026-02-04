"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchLocations,
  fetchLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  deactivateLocation,
  reactivateLocation,
  type LocationFilters,
  type CreateLocationInput,
  type UpdateLocationInput,
} from "@/lib/firestore/locations";

// Query keys factory
export const locationKeys = {
  all: ["locations"] as const,
  lists: () => [...locationKeys.all, "list"] as const,
  list: (filters: LocationFilters) => [...locationKeys.lists(), filters] as const,
  details: () => [...locationKeys.all, "detail"] as const,
  detail: (id: string) => [...locationKeys.details(), id] as const,
};

// List locations
export function useLocations(filters?: LocationFilters) {
  return useQuery({
    queryKey: locationKeys.list(filters ?? {}),
    queryFn: () => fetchLocations(filters),
  });
}

// Single location
export function useLocation(id: string) {
  return useQuery({
    queryKey: locationKeys.detail(id),
    queryFn: () => fetchLocation(id),
    enabled: !!id,
  });
}

// Create location mutation
export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLocationInput) => createLocation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
  });
}

// Update location mutation
export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateLocationInput) => updateLocation(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: locationKeys.detail(variables.id) });
    },
  });
}

// Delete location mutation
export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
  });
}

// Deactivate location mutation
export function useDeactivateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
  });
}

// Reactivate location mutation
export function useReactivateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reactivateLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
  });
}
