import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../storage/secureStorage", () => {
  const memory = new Map<string, string>();
  return {
    secureStorage: {
      getItem: async (name: string) => memory.get(name) ?? null,
      setItem: async (name: string, value: string) => {
        memory.set(name, value);
      },
      removeItem: async (name: string) => {
        memory.delete(name);
      },
    },
  };
});

import { forceDevLogin, useAuthStore } from "./authStore";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    useAuthStore.setState({ isHydrated: true, isLoading: false });
  });

  it("starts logged out", () => {
    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(false);
    expect(s.accessToken).toBeNull();
    expect(s.user).toBeNull();
  });

  it("login sets session fields", () => {
    useAuthStore.getState().login({
      accessToken: "tok",
      chatToken: "chat",
      user: {
        id: "1",
        email: "a@b.com",
        name: "A",
        isEmailVerified: true,
      },
      serviceType: null,
    });
    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(true);
    expect(s.accessToken).toBe("tok");
    expect(s.user?.email).toBe("a@b.com");
  });

  it("logout clears session", () => {
    forceDevLogin({ email: "dev@stayverse.com" });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("refreshToken overwrites access token locally", () => {
    forceDevLogin();
    useAuthStore.getState().refreshToken("new-token");
    expect(useAuthStore.getState().accessToken).toBe("new-token");
  });
});
