"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  fetchActivityLogs,
  logActivity,
  type LogActivityInput,
  type ActivityFilters,
  type ActivityAction,
  type ActivityResourceType,
} from "@/lib/firestore/activity-log";

// Query keys factory
export const activityLogKeys = {
  all: ["activityLogs"] as const,
  lists: () => [...activityLogKeys.all, "list"] as const,
  list: (filters: ActivityFilters) => [...activityLogKeys.lists(), filters] as const,
};

// Fetch activity logs
export function useActivityLogs(filters?: ActivityFilters) {
  return useQuery({
    queryKey: activityLogKeys.list(filters ?? {}),
    queryFn: () => fetchActivityLogs(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Log activity mutation
export function useLogActivity() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const { currentUser } = useCurrentUser();

  return useMutation({
    mutationFn: (input: Omit<LogActivityInput, "actorId" | "actorName" | "actorEmail">) =>
      logActivity({
        ...input,
        actorId: authUser?.uid || "unknown",
        actorName: currentUser?.displayName || authUser?.displayName || "Unknown User",
        actorEmail: authUser?.email || "unknown@example.com",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityLogKeys.lists() });
    },
  });
}

// Convenience hook that provides a simple log function
export function useActivityLogger() {
  const logActivityMutation = useLogActivity();

  const log = async (
    action: ActivityAction,
    resourceType: ActivityResourceType,
    resourceId: string,
    resourceName: string,
    metadata?: Record<string, unknown>
  ) => {
    try {
      await logActivityMutation.mutateAsync({
        action,
        resourceType,
        resourceId,
        resourceName,
        metadata,
      });
    } catch (error) {
      // Log errors but don't throw - activity logging should not break main functionality
      console.error("Failed to log activity:", error);
    }
  };

  return { log, isLogging: logActivityMutation.isPending };
}
