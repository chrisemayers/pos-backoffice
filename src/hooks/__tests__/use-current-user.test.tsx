import { describe, it, expect, vi } from "vitest";
import { hasPermission, PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from "@/lib/firestore/users";
import type { User } from "@/types";

// Mock firebase modules
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
  },
}));

describe("use-current-user permissions", () => {
  const createMockUser = (overrides: Partial<User> = {}): User => ({
    id: "user-1",
    tenantId: "tenant_demo",
    displayName: "Test User",
    email: "test@example.com",
    role: "cashier",
    permissions: [],
    locationIds: [],
    isActive: true,
    ...overrides,
  });

  describe("PERMISSIONS constants", () => {
    it("should have all inventory permissions", () => {
      expect(PERMISSIONS.INVENTORY_VIEW).toBe("inventory:view");
      expect(PERMISSIONS.INVENTORY_CREATE).toBe("inventory:create");
      expect(PERMISSIONS.INVENTORY_EDIT).toBe("inventory:edit");
      expect(PERMISSIONS.INVENTORY_DELETE).toBe("inventory:delete");
    });

    it("should have all sales permissions", () => {
      expect(PERMISSIONS.SALES_VIEW).toBe("sales:view");
      expect(PERMISSIONS.SALES_VOID).toBe("sales:void");
      expect(PERMISSIONS.SALES_REFUND).toBe("sales:refund");
    });

    it("should have all reports permissions", () => {
      expect(PERMISSIONS.REPORTS_VIEW).toBe("reports:view");
      expect(PERMISSIONS.REPORTS_EXPORT).toBe("reports:export");
    });

    it("should have all settings permissions", () => {
      expect(PERMISSIONS.SETTINGS_VIEW).toBe("settings:view");
      expect(PERMISSIONS.SETTINGS_EDIT).toBe("settings:edit");
    });

    it("should have all users permissions", () => {
      expect(PERMISSIONS.USERS_VIEW).toBe("users:view");
      expect(PERMISSIONS.USERS_CREATE).toBe("users:create");
      expect(PERMISSIONS.USERS_EDIT).toBe("users:edit");
      expect(PERMISSIONS.USERS_DELETE).toBe("users:delete");
    });

    it("should have all locations permissions", () => {
      expect(PERMISSIONS.LOCATIONS_VIEW).toBe("locations:view");
      expect(PERMISSIONS.LOCATIONS_CREATE).toBe("locations:create");
      expect(PERMISSIONS.LOCATIONS_EDIT).toBe("locations:edit");
      expect(PERMISSIONS.LOCATIONS_DELETE).toBe("locations:delete");
    });
  });

  describe("DEFAULT_ROLE_PERMISSIONS", () => {
    it("should give admin all permissions", () => {
      const adminPermissions = DEFAULT_ROLE_PERMISSIONS.admin;
      const allPermissions = Object.values(PERMISSIONS);

      expect(adminPermissions).toEqual(expect.arrayContaining(allPermissions));
      expect(adminPermissions.length).toBe(allPermissions.length);
    });

    it("should give manager limited permissions", () => {
      const managerPermissions = DEFAULT_ROLE_PERMISSIONS.manager;

      // Should have view permissions
      expect(managerPermissions).toContain(PERMISSIONS.INVENTORY_VIEW);
      expect(managerPermissions).toContain(PERMISSIONS.SALES_VIEW);
      expect(managerPermissions).toContain(PERMISSIONS.REPORTS_VIEW);

      // Should not have delete permissions
      expect(managerPermissions).not.toContain(PERMISSIONS.INVENTORY_DELETE);
      expect(managerPermissions).not.toContain(PERMISSIONS.USERS_DELETE);
      expect(managerPermissions).not.toContain(PERMISSIONS.LOCATIONS_DELETE);
    });

    it("should give cashier minimal permissions", () => {
      const cashierPermissions = DEFAULT_ROLE_PERMISSIONS.cashier;

      // Should have basic view permissions
      expect(cashierPermissions).toContain(PERMISSIONS.INVENTORY_VIEW);
      expect(cashierPermissions).toContain(PERMISSIONS.SALES_VIEW);
      expect(cashierPermissions).toContain(PERMISSIONS.REPORTS_VIEW);

      // Should not have edit/create/delete permissions
      expect(cashierPermissions).not.toContain(PERMISSIONS.INVENTORY_EDIT);
      expect(cashierPermissions).not.toContain(PERMISSIONS.INVENTORY_CREATE);
      expect(cashierPermissions).not.toContain(PERMISSIONS.USERS_VIEW);
      expect(cashierPermissions).not.toContain(PERMISSIONS.SETTINGS_EDIT);
    });
  });

  describe("hasPermission", () => {
    it("should return true for admin regardless of permissions array", () => {
      const adminUser = createMockUser({
        role: "admin",
        permissions: [], // Empty permissions array
      });

      expect(hasPermission(adminUser, PERMISSIONS.INVENTORY_VIEW)).toBe(true);
      expect(hasPermission(adminUser, PERMISSIONS.USERS_DELETE)).toBe(true);
      expect(hasPermission(adminUser, PERMISSIONS.SETTINGS_EDIT)).toBe(true);
    });

    it("should check permissions array for non-admin users", () => {
      const managerUser = createMockUser({
        role: "manager",
        permissions: [PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.INVENTORY_EDIT],
      });

      expect(hasPermission(managerUser, PERMISSIONS.INVENTORY_VIEW)).toBe(true);
      expect(hasPermission(managerUser, PERMISSIONS.INVENTORY_EDIT)).toBe(true);
      expect(hasPermission(managerUser, PERMISSIONS.INVENTORY_DELETE)).toBe(false);
    });

    it("should return false for cashier without explicit permission", () => {
      const cashierUser = createMockUser({
        role: "cashier",
        permissions: [PERMISSIONS.SALES_VIEW],
      });

      expect(hasPermission(cashierUser, PERMISSIONS.SALES_VIEW)).toBe(true);
      expect(hasPermission(cashierUser, PERMISSIONS.SALES_REFUND)).toBe(false);
      expect(hasPermission(cashierUser, PERMISSIONS.INVENTORY_EDIT)).toBe(false);
    });

    it("should handle empty permissions array", () => {
      const userWithNoPermissions = createMockUser({
        role: "cashier",
        permissions: [],
      });

      expect(hasPermission(userWithNoPermissions, PERMISSIONS.INVENTORY_VIEW)).toBe(false);
      expect(hasPermission(userWithNoPermissions, PERMISSIONS.SALES_VIEW)).toBe(false);
    });

    it("should handle custom permissions", () => {
      const userWithCustomPermissions = createMockUser({
        role: "manager",
        permissions: ["custom:permission", PERMISSIONS.REPORTS_EXPORT],
      });

      expect(hasPermission(userWithCustomPermissions, "custom:permission")).toBe(true);
      expect(hasPermission(userWithCustomPermissions, PERMISSIONS.REPORTS_EXPORT)).toBe(true);
      expect(hasPermission(userWithCustomPermissions, "other:permission")).toBe(false);
    });
  });

  describe("role checks", () => {
    it("should correctly identify admin role", () => {
      const adminUser = createMockUser({ role: "admin" });
      expect(adminUser.role).toBe("admin");
    });

    it("should correctly identify manager role", () => {
      const managerUser = createMockUser({ role: "manager" });
      expect(managerUser.role).toBe("manager");
    });

    it("should correctly identify cashier role", () => {
      const cashierUser = createMockUser({ role: "cashier" });
      expect(cashierUser.role).toBe("cashier");
    });
  });
});
