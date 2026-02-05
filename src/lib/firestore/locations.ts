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
import type { Location } from "@/types";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "tenant_demo";

export interface LocationFilters {
  search?: string;
  isActive?: boolean;
}

// Fields required when creating a location (tenantId is auto-set)
export type CreateLocationInput = {
  name: string;
  address: string;
  timezone: string;
  currency: string;
};

// Fields that can be updated
export type UpdateLocationInput = Partial<Omit<Location, "id" | "tenantId">> & { id: string };

// Collection reference helper
function locationsCollection() {
  return collection(db, `tenants/${TENANT_ID}/locations`);
}

// Fetch all locations with optional filters
export async function fetchLocations(filters?: LocationFilters): Promise<Location[]> {
  try {
    let q;

    if (filters?.isActive !== undefined) {
      q = query(
        locationsCollection(),
        where("isActive", "==", filters.isActive),
        orderBy("name")
      );
    } else {
      q = query(locationsCollection(), orderBy("name"));
    }

    const snapshot = await getDocs(q);

    const locations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Location[];

    // Client-side filtering for search
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      return locations.filter(
        (l) =>
          l.name.toLowerCase().includes(search) ||
          l.address.toLowerCase().includes(search)
      );
    }

    return locations;
  } catch (error) {
    console.error(
      `[Firestore] Error fetching locations from tenants/${TENANT_ID}/locations:`,
      error
    );
    throw error;
  }
}

// Fetch single location
export async function fetchLocation(id: string): Promise<Location | null> {
  const docRef = doc(locationsCollection(), id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Location;
}

// Create location
export async function createLocation(input: CreateLocationInput): Promise<Location> {
  const locationData = {
    ...input,
    tenantId: TENANT_ID,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = doc(locationsCollection());
  await setDoc(docRef, locationData);

  return {
    id: docRef.id,
    ...input,
    tenantId: TENANT_ID,
    isActive: true,
  };
}

// Update location
export async function updateLocation(input: UpdateLocationInput): Promise<void> {
  const { id, ...data } = input;
  const docRef = doc(locationsCollection(), id);

  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: Timestamp.now(),
  };

  await updateDoc(docRef, updateData);
}

// Delete location (hard delete)
export async function deleteLocation(id: string): Promise<void> {
  const docRef = doc(locationsCollection(), id);
  await deleteDoc(docRef);
}

// Deactivate location (soft delete)
export async function deactivateLocation(id: string): Promise<void> {
  const docRef = doc(locationsCollection(), id);
  await updateDoc(docRef, {
    isActive: false,
    updatedAt: Timestamp.now(),
  });
}

// Reactivate location
export async function reactivateLocation(id: string): Promise<void> {
  const docRef = doc(locationsCollection(), id);
  await updateDoc(docRef, {
    isActive: true,
    updatedAt: Timestamp.now(),
  });
}

// Common timezones for dropdown
export const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "America/Phoenix", label: "Arizona (no DST)" },
  { value: "America/Puerto_Rico", label: "Atlantic Time (AT)" },
  { value: "America/Port_of_Spain", label: "Trinidad & Tobago" },
  { value: "America/Jamaica", label: "Jamaica" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Central European Time" },
  { value: "Asia/Tokyo", label: "Japan Standard Time" },
  { value: "Asia/Singapore", label: "Singapore Time" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
] as const;

// Common currencies for dropdown
export const COMMON_CURRENCIES = [
  { value: "USD", label: "US Dollar ($)", symbol: "$" },
  { value: "EUR", label: "Euro (€)", symbol: "€" },
  { value: "GBP", label: "British Pound (£)", symbol: "£" },
  { value: "CAD", label: "Canadian Dollar (C$)", symbol: "C$" },
  { value: "AUD", label: "Australian Dollar (A$)", symbol: "A$" },
  { value: "TTD", label: "Trinidad Dollar (TT$)", symbol: "TT$" },
  { value: "JMD", label: "Jamaican Dollar (J$)", symbol: "J$" },
  { value: "BBD", label: "Barbados Dollar (Bds$)", symbol: "Bds$" },
  { value: "XCD", label: "East Caribbean Dollar (EC$)", symbol: "EC$" },
  { value: "MXN", label: "Mexican Peso (MX$)", symbol: "MX$" },
  { value: "JPY", label: "Japanese Yen (¥)", symbol: "¥" },
  { value: "SGD", label: "Singapore Dollar (S$)", symbol: "S$" },
] as const;
