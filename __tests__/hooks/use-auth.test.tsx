import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuthStore } from "@/stores/auth-store";

// Reset store before each test
beforeEach(() => {
  useAuthStore.setState({
    user: null,
    isLoading: true,
    isInitialized: false,
  });
});

describe("useAuthStore", () => {
  it("has correct initial state", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(true);
    expect(state.isInitialized).toBe(false);
  });

  it("setUser updates user and sets loading to false", () => {
    const mockUser = { uid: "123", email: "test@example.com" } as any;

    act(() => {
      useAuthStore.getState().setUser(mockUser);
    });

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isLoading).toBe(false);
  });

  it("setUser with null clears user", () => {
    const mockUser = { uid: "123", email: "test@example.com" } as any;

    act(() => {
      useAuthStore.getState().setUser(mockUser);
    });

    act(() => {
      useAuthStore.getState().setUser(null);
    });

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it("setLoading updates loading state", () => {
    act(() => {
      useAuthStore.getState().setLoading(false);
    });

    expect(useAuthStore.getState().isLoading).toBe(false);

    act(() => {
      useAuthStore.getState().setLoading(true);
    });

    expect(useAuthStore.getState().isLoading).toBe(true);
  });

  it("setInitialized marks as initialized and stops loading", () => {
    expect(useAuthStore.getState().isInitialized).toBe(false);
    expect(useAuthStore.getState().isLoading).toBe(true);

    act(() => {
      useAuthStore.getState().setInitialized();
    });

    const state = useAuthStore.getState();
    expect(state.isInitialized).toBe(true);
    expect(state.isLoading).toBe(false);
  });
});

describe("useAuthStore with renderHook", () => {
  it("provides reactive state updates", () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.user).toBeNull();

    const mockUser = { uid: "123", email: "test@example.com" } as any;

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isLoading).toBe(false);
  });
});
