import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getActionDescription,
  getActionIcon,
  type ActivityAction,
  type ActivityResourceType,
} from "../activity-log";

// Mock firebase/firestore
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(() => ({ id: "mock-doc-id" })),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
  },
}));

describe("activity-log", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getActionDescription", () => {
    it("should return correct description for user actions", () => {
      expect(getActionDescription("user.created")).toBe("created user");
      expect(getActionDescription("user.updated")).toBe("updated user");
      expect(getActionDescription("user.deleted")).toBe("deleted user");
      expect(getActionDescription("user.deactivated")).toBe("deactivated user");
      expect(getActionDescription("user.reactivated")).toBe("reactivated user");
      expect(getActionDescription("user.permissions_updated")).toBe("updated permissions for");
    });

    it("should return correct description for invitation actions", () => {
      expect(getActionDescription("invitation.created")).toBe("sent invitation to");
      expect(getActionDescription("invitation.revoked")).toBe("revoked invitation for");
      expect(getActionDescription("invitation.accepted")).toBe("accepted invitation");
    });

    it("should return correct description for location actions", () => {
      expect(getActionDescription("location.created")).toBe("created location");
      expect(getActionDescription("location.updated")).toBe("updated location");
      expect(getActionDescription("location.deleted")).toBe("deleted location");
      expect(getActionDescription("location.deactivated")).toBe("deactivated location");
      expect(getActionDescription("location.reactivated")).toBe("reactivated location");
    });

    it("should return correct description for product actions", () => {
      expect(getActionDescription("product.created")).toBe("added product");
      expect(getActionDescription("product.updated")).toBe("updated product");
      expect(getActionDescription("product.deleted")).toBe("archived product");
      expect(getActionDescription("product.restored")).toBe("restored product");
    });

    it("should return correct description for settings actions", () => {
      expect(getActionDescription("settings.updated")).toBe("updated settings");
    });

    it("should return correct description for sale actions", () => {
      expect(getActionDescription("sale.created")).toBe("processed sale");
      expect(getActionDescription("sale.refunded")).toBe("refunded sale");
    });

    it("should return the action itself for unknown actions", () => {
      const unknownAction = "unknown.action" as ActivityAction;
      expect(getActionDescription(unknownAction)).toBe("unknown.action");
    });
  });

  describe("getActionIcon", () => {
    it("should return correct icon for each resource type", () => {
      expect(getActionIcon("user")).toBe("Users");
      expect(getActionIcon("invitation")).toBe("Mail");
      expect(getActionIcon("location")).toBe("Building2");
      expect(getActionIcon("product")).toBe("Package");
      expect(getActionIcon("settings")).toBe("Settings");
      expect(getActionIcon("sale")).toBe("ShoppingCart");
    });

    it("should return Activity for unknown resource types", () => {
      const unknownType = "unknown" as ActivityResourceType;
      expect(getActionIcon(unknownType)).toBe("Activity");
    });
  });
});
