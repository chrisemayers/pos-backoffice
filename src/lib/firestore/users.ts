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

export interface UserFilters {
  search?: string;
  role?: User["role"];
  locationId?: string;
  isActive?: boolean;
}

// Fields required when creating a user (tenantId and isActive are auto-set)
export type CreateUserInput = {
  displayName: string;
  email: string;
  role: User["role"];
  permissions: string[];
  locationIds: string[];
  defaultLocationId?: string;
};

// Fields that can be updated
export type UpdateUserInput = Partial<Omit<User, "id" | "tenantId" | "lastLogin">> & { id: string };

// Collection reference helper
function usersCollection() {
  return collection(db, `tenants/${TENANT_ID}/users`);
}

// Fetch all users with optional filters
export async function fetchUsers(filters?: UserFilters): Promise<User[]> {
  try {
    let q;

    // Build query based on filters
    if (filters?.isActive !== undefined) {
      if (filters?.role) {
        q = query(
          usersCollection(),
          where("isActive", "==", filters.isActive),
          where("role", "==", filters.role),
          orderBy("displayName")
        );
      } else {
        q = query(
          usersCollection(),
          where("isActive", "==", filters.isActive),
          orderBy("displayName")
        );
      }
    } else if (filters?.role) {
      q = query(
        usersCollection(),
        where("role", "==", filters.role),
        orderBy("displayName")
      );
    } else {
      q = query(usersCollection(), orderBy("displayName"));
    }

    const snapshot = await getDocs(q);

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      lastLogin: doc.data().lastLogin?.toDate?.() || undefined,
    })) as User[];

    // Client-side filtering for search and location
    let filtered = users;

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.displayName.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)
      );
    }

    if (filters?.locationId) {
      filtered = filtered.filter((u) =>
        u.locationIds.includes(filters.locationId!)
      );
    }

    return filtered;
  } catch (error) {
    console.error(
      `[Firestore] Error fetching users from tenants/${TENANT_ID}/users:`,
      error
    );
    throw error;
  }
}

// Fetch single user
export async function fetchUser(id: string): Promise<User | null> {
  const docRef = doc(usersCollection(), id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
    lastLogin: snapshot.data().lastLogin?.toDate?.() || undefined,
  } as User;
}

// Fetch user by email
export async function fetchUserByEmail(email: string): Promise<User | null> {
  const q = query(usersCollection(), where("email", "==", email));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    lastLogin: doc.data().lastLogin?.toDate?.() || undefined,
  } as User;
}

// Create user
export async function createUser(input: CreateUserInput): Promise<User> {
  const userData = {
    ...input,
    tenantId: TENANT_ID,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  // Use a generated ID for the document
  const docRef = doc(usersCollection());
  await setDoc(docRef, userData);

  return {
    id: docRef.id,
    ...input,
    tenantId: TENANT_ID,
    isActive: true,
  };
}

// Update user
export async function updateUser(input: UpdateUserInput): Promise<void> {
  const { id, ...data } = input;
  const docRef = doc(usersCollection(), id);

  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: Timestamp.now(),
  };

  await updateDoc(docRef, updateData);
}

// Delete user (hard delete - consider soft delete for audit trail)
export async function deleteUser(id: string): Promise<void> {
  const docRef = doc(usersCollection(), id);
  await deleteDoc(docRef);
}

// Deactivate user (soft delete alternative)
export async function deactivateUser(id: string): Promise<void> {
  const docRef = doc(usersCollection(), id);
  await updateDoc(docRef, {
    isActive: false,
    updatedAt: Timestamp.now(),
  });
}

// Reactivate user
export async function reactivateUser(id: string): Promise<void> {
  const docRef = doc(usersCollection(), id);
  await updateDoc(docRef, {
    isActive: true,
    updatedAt: Timestamp.now(),
  });
}

// Update user's last login
export async function updateLastLogin(id: string): Promise<void> {
  const docRef = doc(usersCollection(), id);
  await updateDoc(docRef, {
    lastLogin: Timestamp.now(),
  });
}

// Update user role
export async function updateUserRole(
  id: string,
  role: User["role"]
): Promise<void> {
  const docRef = doc(usersCollection(), id);
  await updateDoc(docRef, {
    role,
    updatedAt: Timestamp.now(),
  });
}

// Update user permissions
export async function updateUserPermissions(
  id: string,
  permissions: string[]
): Promise<void> {
  const docRef = doc(usersCollection(), id);
  await updateDoc(docRef, {
    permissions,
    updatedAt: Timestamp.now(),
  });
}

// Add user to location
export async function addUserToLocation(
  userId: string,
  locationId: string
): Promise<void> {
  const user = await fetchUser(userId);
  if (!user) throw new Error("User not found");

  const locationIds = [...new Set([...user.locationIds, locationId])];
  await updateUser({ id: userId, locationIds });
}

// Remove user from location
export async function removeUserFromLocation(
  userId: string,
  locationId: string
): Promise<void> {
  const user = await fetchUser(userId);
  if (!user) throw new Error("User not found");

  const locationIds = user.locationIds.filter((id) => id !== locationId);
  await updateUser({ id: userId, locationIds });
}

// Permission constants
export const PERMISSIONS = {
  // Inventory
  INVENTORY_VIEW: "inventory:view",
  INVENTORY_CREATE: "inventory:create",
  INVENTORY_EDIT: "inventory:edit",
  INVENTORY_DELETE: "inventory:delete",

  // Sales
  SALES_VIEW: "sales:view",
  SALES_VOID: "sales:void",
  SALES_REFUND: "sales:refund",

  // Reports
  REPORTS_VIEW: "reports:view",
  REPORTS_EXPORT: "reports:export",

  // Settings
  SETTINGS_VIEW: "settings:view",
  SETTINGS_EDIT: "settings:edit",

  // Users
  USERS_VIEW: "users:view",
  USERS_CREATE: "users:create",
  USERS_EDIT: "users:edit",
  USERS_DELETE: "users:delete",

  // Locations
  LOCATIONS_VIEW: "locations:view",
  LOCATIONS_CREATE: "locations:create",
  LOCATIONS_EDIT: "locations:edit",
  LOCATIONS_DELETE: "locations:delete",
} as const;

// Default permissions by role
export const DEFAULT_ROLE_PERMISSIONS: Record<User["role"], string[]> = {
  admin: Object.values(PERMISSIONS),
  manager: [
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_EDIT,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_VOID,
    PERMISSIONS.SALES_REFUND,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.LOCATIONS_VIEW,
  ],
  cashier: [
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
};

// Check if user has permission
export function hasPermission(user: User, permission: string): boolean {
  // Admins have all permissions
  if (user.role === "admin") return true;

  // Check explicit permissions
  return user.permissions.includes(permission);
}
