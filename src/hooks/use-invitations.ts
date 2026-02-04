"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchInvitations,
  fetchInvitation,
  fetchInvitationByEmail,
  createInvitation,
  revokeInvitation,
  resendInvitation,
  deleteInvitation,
  type CreateInvitationInput,
  type InvitationStatus,
} from "@/lib/firestore/invitations";

// Query keys factory
export const invitationKeys = {
  all: ["invitations"] as const,
  lists: () => [...invitationKeys.all, "list"] as const,
  list: (status?: InvitationStatus) => [...invitationKeys.lists(), status] as const,
  details: () => [...invitationKeys.all, "detail"] as const,
  detail: (id: string) => [...invitationKeys.details(), id] as const,
  byEmail: (email: string) => [...invitationKeys.all, "email", email] as const,
};

// List invitations
export function useInvitations(status?: InvitationStatus) {
  return useQuery({
    queryKey: invitationKeys.list(status),
    queryFn: () => fetchInvitations(status),
  });
}

// Single invitation
export function useInvitation(id: string) {
  return useQuery({
    queryKey: invitationKeys.detail(id),
    queryFn: () => fetchInvitation(id),
    enabled: !!id,
  });
}

// Invitation by email
export function useInvitationByEmail(email: string) {
  return useQuery({
    queryKey: invitationKeys.byEmail(email),
    queryFn: () => fetchInvitationByEmail(email),
    enabled: !!email,
  });
}

// Create invitation mutation
export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInvitationInput) => createInvitation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() });
    },
  });
}

// Revoke invitation mutation
export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => revokeInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() });
    },
  });
}

// Resend invitation mutation
export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => resendInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() });
    },
  });
}

// Delete invitation mutation
export function useDeleteInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() });
    },
  });
}
