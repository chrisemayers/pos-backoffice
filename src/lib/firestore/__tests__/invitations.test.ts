import { describe, it, expect, vi, beforeEach } from "vitest";
import { isInvitationExpired, getInvitationLink } from "../invitations";
import type { Invitation } from "../invitations";

// Mock firebase/firestore
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(() => ({ id: "mock-doc-id" })),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
    fromDate: vi.fn((date: Date) => ({ toDate: () => date })),
  },
}));

describe("invitations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isInvitationExpired", () => {
    it("should return true for expired invitation", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      const invitation: Invitation = {
        id: "inv-1",
        tenantId: "tenant_demo",
        email: "test@example.com",
        role: "cashier",
        invitedBy: "user-1",
        invitedByName: "Admin User",
        status: "pending",
        expiresAt: pastDate,
        createdAt: new Date(),
      };

      expect(isInvitationExpired(invitation)).toBe(true);
    });

    it("should return false for non-expired invitation", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

      const invitation: Invitation = {
        id: "inv-1",
        tenantId: "tenant_demo",
        email: "test@example.com",
        role: "cashier",
        invitedBy: "user-1",
        invitedByName: "Admin User",
        status: "pending",
        expiresAt: futureDate,
        createdAt: new Date(),
      };

      expect(isInvitationExpired(invitation)).toBe(false);
    });

    it("should return true for invitation expiring right now", () => {
      const now = new Date();
      now.setMilliseconds(now.getMilliseconds() - 1); // Just passed

      const invitation: Invitation = {
        id: "inv-1",
        tenantId: "tenant_demo",
        email: "test@example.com",
        role: "manager",
        invitedBy: "user-1",
        invitedByName: "Admin User",
        status: "pending",
        expiresAt: now,
        createdAt: new Date(),
      };

      expect(isInvitationExpired(invitation)).toBe(true);
    });
  });

  describe("getInvitationLink", () => {
    it("should generate correct invitation link", () => {
      const invitationId = "abc123";
      const link = getInvitationLink(invitationId);

      expect(link).toContain("/invite/abc123");
    });

    it("should include the invitation ID in the link", () => {
      const invitationId = "test-invitation-id-456";
      const link = getInvitationLink(invitationId);

      expect(link).toContain(invitationId);
    });

    it("should handle special characters in invitation ID", () => {
      const invitationId = "inv_123-abc";
      const link = getInvitationLink(invitationId);

      expect(link).toContain(invitationId);
      expect(link).toMatch(/\/invite\/inv_123-abc$/);
    });
  });
});
