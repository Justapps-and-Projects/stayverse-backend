import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
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

const loginMock = vi.fn();
vi.mock("../api/endpoints/auth", async () => {
  const actual = await vi.importActual<typeof import("../api/endpoints/auth")>(
    "../api/endpoints/auth",
  );
  return {
    ...actual,
    login: (...args: unknown[]) => loginMock(...args),
  };
});

import { useLoginMutation } from "./useAuthMutations";
import { useAuthStore } from "../stores/authStore";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return React.createElement(QueryClientProvider, { client }, children);
}

describe("useLoginMutation", () => {
  beforeEach(() => {
    loginMock.mockReset();
    useAuthStore.getState().logout();
    useAuthStore.setState({ isHydrated: true, isLoading: false });
  });

  it("sets session on verified login", async () => {
    loginMock.mockResolvedValue({
      accessToken: "tok",
      chatToken: "chat",
      isEmailVerified: true,
      user: {
        id: "1",
        email: "a@b.com",
        name: "A",
        isEmailVerified: true,
      },
    });

    const { result } = renderHook(() => useLoginMutation(), { wrapper });
    result.current.mutate({ email: "a@b.com", password: "x" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe("tok");
  });

  it("errors when email is not verified", async () => {
    loginMock.mockResolvedValue({
      accessToken: "tok",
      chatToken: null,
      isEmailVerified: false,
      user: {
        id: "1",
        email: "a@b.com",
        name: "A",
        isEmailVerified: false,
      },
    });

    const { result } = renderHook(() => useLoginMutation(), { wrapper });
    result.current.mutate({ email: "a@b.com", password: "x" });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
