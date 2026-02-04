import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "tenant_demo";

export type ActivityAction =
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "user.deactivated"
  | "user.reactivated"
  | "user.permissions_updated"
  | "invitation.created"
  | "invitation.revoked"
  | "invitation.accepted"
  | "location.created"
  | "location.updated"
  | "location.deleted"
  | "location.deactivated"
  | "location.reactivated"
  | "product.created"
  | "product.updated"
  | "product.deleted"
  | "product.restored"
  | "settings.updated"
  | "sale.created"
  | "sale.refunded";

export type ActivityResourceType =
  | "user"
  | "invitation"
  | "location"
  | "product"
  | "settings"
  | "sale";

export interface ActivityLog {
  id: string;
  tenantId: string;
  action: ActivityAction;
  resourceType: ActivityResourceType;
  resourceId: string;
  resourceName: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface LogActivityInput {
  action: ActivityAction;
  resourceType: ActivityResourceType;
  resourceId: string;
  resourceName: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityFilters {
  resourceType?: ActivityResourceType;
  resourceId?: string;
  actorId?: string;
  action?: ActivityAction;
  limit?: number;
}

// Collection reference helper
function activityLogCollection() {
  return collection(db, `tenants/${TENANT_ID}/activityLogs`);
}

// Log an activity
export async function logActivity(input: LogActivityInput): Promise<ActivityLog> {
  const activityData = {
    ...input,
    tenantId: TENANT_ID,
    timestamp: Timestamp.now(),
  };

  console.log(
    `[Firestore] Logging activity in tenants/${TENANT_ID}/activityLogs:`,
    input.action
  );

  const docRef = doc(activityLogCollection());
  await setDoc(docRef, activityData);

  return {
    id: docRef.id,
    ...input,
    tenantId: TENANT_ID,
    timestamp: new Date(),
  };
}

// Fetch activity logs with filters
export async function fetchActivityLogs(
  filters?: ActivityFilters
): Promise<ActivityLog[]> {
  try {
    const maxResults = filters?.limit || 50;
    let q;

    // Build query based on filters
    if (filters?.resourceType && filters?.resourceId) {
      q = query(
        activityLogCollection(),
        where("resourceType", "==", filters.resourceType),
        where("resourceId", "==", filters.resourceId),
        orderBy("timestamp", "desc"),
        limit(maxResults)
      );
    } else if (filters?.resourceType) {
      q = query(
        activityLogCollection(),
        where("resourceType", "==", filters.resourceType),
        orderBy("timestamp", "desc"),
        limit(maxResults)
      );
    } else if (filters?.actorId) {
      q = query(
        activityLogCollection(),
        where("actorId", "==", filters.actorId),
        orderBy("timestamp", "desc"),
        limit(maxResults)
      );
    } else {
      q = query(
        activityLogCollection(),
        orderBy("timestamp", "desc"),
        limit(maxResults)
      );
    }

    const snapshot = await getDocs(q);
    console.log(
      `[Firestore] Fetched ${snapshot.docs.length} activity logs from tenants/${TENANT_ID}/activityLogs`
    );

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || new Date(),
    })) as ActivityLog[];
  } catch (error) {
    console.error(
      `[Firestore] Error fetching activity logs from tenants/${TENANT_ID}/activityLogs:`,
      error
    );
    throw error;
  }
}

// Helper to get human-readable action descriptions
export function getActionDescription(action: ActivityAction): string {
  const descriptions: Record<ActivityAction, string> = {
    "user.created": "created user",
    "user.updated": "updated user",
    "user.deleted": "deleted user",
    "user.deactivated": "deactivated user",
    "user.reactivated": "reactivated user",
    "user.permissions_updated": "updated permissions for",
    "invitation.created": "sent invitation to",
    "invitation.revoked": "revoked invitation for",
    "invitation.accepted": "accepted invitation",
    "location.created": "created location",
    "location.updated": "updated location",
    "location.deleted": "deleted location",
    "location.deactivated": "deactivated location",
    "location.reactivated": "reactivated location",
    "product.created": "added product",
    "product.updated": "updated product",
    "product.deleted": "archived product",
    "product.restored": "restored product",
    "settings.updated": "updated settings",
    "sale.created": "processed sale",
    "sale.refunded": "refunded sale",
  };

  return descriptions[action] || action;
}

// Helper to get icon name for action type
export function getActionIcon(resourceType: ActivityResourceType): string {
  const icons: Record<ActivityResourceType, string> = {
    user: "Users",
    invitation: "Mail",
    location: "Building2",
    product: "Package",
    settings: "Settings",
    sale: "ShoppingCart",
  };

  return icons[resourceType] || "Activity";
}
