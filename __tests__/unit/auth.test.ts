import { describe, it, expect } from "vitest";
import { getAuthErrorMessage } from "@/lib/auth";

describe("getAuthErrorMessage", () => {
  it("returns user-friendly message for invalid credentials", () => {
    expect(getAuthErrorMessage("auth/invalid-credential")).toBe(
      "Invalid email or password"
    );
  });

  it("returns user-friendly message for user not found", () => {
    expect(getAuthErrorMessage("auth/user-not-found")).toBe(
      "No account found with this email"
    );
  });

  it("returns user-friendly message for wrong password", () => {
    expect(getAuthErrorMessage("auth/wrong-password")).toBe("Incorrect password");
  });

  it("returns user-friendly message for invalid email", () => {
    expect(getAuthErrorMessage("auth/invalid-email")).toBe("Invalid email address");
  });

  it("returns user-friendly message for disabled user", () => {
    expect(getAuthErrorMessage("auth/user-disabled")).toBe(
      "This account has been disabled"
    );
  });

  it("returns user-friendly message for too many requests", () => {
    expect(getAuthErrorMessage("auth/too-many-requests")).toBe(
      "Too many attempts. Please try again later"
    );
  });

  it("returns user-friendly message for network error", () => {
    expect(getAuthErrorMessage("auth/network-request-failed")).toBe(
      "Network error. Check your connection"
    );
  });

  it("returns user-friendly message for popup closed", () => {
    expect(getAuthErrorMessage("auth/popup-closed-by-user")).toBe(
      "Sign-in popup was closed"
    );
  });

  it("returns generic message for unknown error codes", () => {
    expect(getAuthErrorMessage("auth/unknown-error")).toBe(
      "An error occurred. Please try again"
    );
    expect(getAuthErrorMessage("some-random-code")).toBe(
      "An error occurred. Please try again"
    );
  });
});
