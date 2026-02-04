import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User } from "@/types";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "tenant_demo";

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export interface Invitation {
  id: string;
  tenantId: string;
  email: string;
  role: User["role"];
  invitedBy: string;
  invitedByName: string;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
}

export type CreateInvitationInput = {
  email: string;
  role: User["role"];
  invitedBy: string;
  invitedByName: string;
};

// Collection reference helper
function invitationsCollection() {
  return collection(db, `tenants/${TENANT_ID}/invitations`);
}

// Fetch all invitations
export async function fetchInvitations(status?: InvitationStatus): Promise<Invitation[]> {
  try {
    let q;

    if (status) {
      q = query(
        invitationsCollection(),
        where("status", "==", status),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(invitationsCollection(), orderBy("createdAt", "desc"));
    }

    const snapshot = await getDocs(q);
    console.log(
      `[Firestore] Fetched ${snapshot.docs.length} invitations from tenants/${TENANT_ID}/invitations`
    );

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      expiresAt: doc.data().expiresAt?.toDate?.() || new Date(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      acceptedAt: doc.data().acceptedAt?.toDate?.() || undefined,
    })) as Invitation[];
  } catch (error) {
    console.error(
      `[Firestore] Error fetching invitations from tenants/${TENANT_ID}/invitations:`,
      error
    );
    throw error;
  }
}

// Fetch single invitation
export async function fetchInvitation(id: string): Promise<Invitation | null> {
  const docRef = doc(invitationsCollection(), id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
    expiresAt: snapshot.data().expiresAt?.toDate?.() || new Date(),
    createdAt: snapshot.data().createdAt?.toDate?.() || new Date(),
    acceptedAt: snapshot.data().acceptedAt?.toDate?.() || undefined,
  } as Invitation;
}

// Fetch invitation by email
export async function fetchInvitationByEmail(email: string): Promise<Invitation | null> {
  const q = query(
    invitationsCollection(),
    where("email", "==", email),
    where("status", "==", "pending")
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  return {
    id: docSnap.id,
    ...docSnap.data(),
    expiresAt: docSnap.data().expiresAt?.toDate?.() || new Date(),
    createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
    acceptedAt: docSnap.data().acceptedAt?.toDate?.() || undefined,
  } as Invitation;
}

// Create invitation
export async function createInvitation(input: CreateInvitationInput): Promise<Invitation> {
  // Check if there's already a pending invitation for this email
  const existing = await fetchInvitationByEmail(input.email);
  if (existing) {
    throw new Error("An invitation for this email already exists");
  }

  // Set expiration to 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invitationData = {
    ...input,
    tenantId: TENANT_ID,
    status: "pending" as InvitationStatus,
    expiresAt: Timestamp.fromDate(expiresAt),
    createdAt: Timestamp.now(),
  };

  console.log(
    `[Firestore] Creating invitation in tenants/${TENANT_ID}/invitations:`,
    invitationData.email
  );

  const docRef = doc(invitationsCollection());
  await setDoc(docRef, invitationData);

  console.log(`[Firestore] Invitation created with ID: ${docRef.id}`);

  return {
    id: docRef.id,
    ...input,
    tenantId: TENANT_ID,
    status: "pending",
    expiresAt,
    createdAt: new Date(),
  };
}

// Revoke invitation
export async function revokeInvitation(id: string): Promise<void> {
  const docRef = doc(invitationsCollection(), id);
  await updateDoc(docRef, {
    status: "revoked",
    updatedAt: Timestamp.now(),
  });
}

// Resend invitation (creates a new one with fresh expiry)
export async function resendInvitation(id: string): Promise<Invitation> {
  const existing = await fetchInvitation(id);
  if (!existing) {
    throw new Error("Invitation not found");
  }

  // Revoke the old one
  await revokeInvitation(id);

  // Create a new one
  return createInvitation({
    email: existing.email,
    role: existing.role,
    invitedBy: existing.invitedBy,
    invitedByName: existing.invitedByName,
  });
}

// Accept invitation (called when user signs up)
export async function acceptInvitation(id: string): Promise<void> {
  const docRef = doc(invitationsCollection(), id);
  await updateDoc(docRef, {
    status: "accepted",
    acceptedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

// Delete invitation
export async function deleteInvitation(id: string): Promise<void> {
  const docRef = doc(invitationsCollection(), id);
  await deleteDoc(docRef);
}

// Check if an invitation is expired
export function isInvitationExpired(invitation: Invitation): boolean {
  return new Date() > invitation.expiresAt;
}

// Get invitation link (for copying)
export function getInvitationLink(invitationId: string): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  return `${baseUrl}/invite/${invitationId}`;
}
