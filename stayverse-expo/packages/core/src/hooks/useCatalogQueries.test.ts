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

const fetchProfile = vi.fn();
const fetchBookings = vi.fn();
const cancelBooking = vi.fn();

vi.mock("../api/endpoints/catalog", async () => {
  const actual = await vi.importActual<
    typeof import("../api/endpoints/catalog")
  >("../api/endpoints/catalog");
  return {
    ...actual,
    fetchProfile: (...args: unknown[]) => fetchProfile(...args),
    fetchBookings: (...args: unknown[]) => fetchBookings(...args),
    cancelBooking: (...args: unknown[]) => cancelBooking(...args),
  };
});

import {
  useBookingsQuery,
  useCancelBookingMutation,
  useProfileQuery,
} from "./useCatalogQueries";
import { useAuthStore } from "../stores/authStore";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return React.createElement(QueryClientProvider, { client }, children);
}

describe("catalog hooks", () => {
  beforeEach(() => {
    fetchProfile.mockReset();
    fetchBookings.mockReset();
    cancelBooking.mockReset();
    useAuthStore.getState().logout();
    useAuthStore.setState({ isHydrated: true, isLoading: false });
    useAuthStore.getState().login({
      accessToken: "tok",
      chatToken: null,
      user: {
        id: "1",
        email: "a@b.com",
        name: "A",
        isEmailVerified: true,
      },
      serviceType: null,
    });
  });

  it("useProfileQuery loads profile", async () => {
    fetchProfile.mockResolvedValue({
      id: "1",
      email: "a@b.com",
      name: "A",
      isEmailVerified: true,
    });
    const { result } = renderHook(() => useProfileQuery(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.email).toBe("a@b.com");
  });

  it("useBookingsQuery loads pages when authenticated", async () => {
    fetchBookings.mockResolvedValue({
      items: [],
      page: 1,
      hasNextPage: false,
    });
    const { result } = renderHook(() => useBookingsQuery("accepted"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchBookings).toHaveBeenCalled();
  });

  it("useCancelBookingMutation calls cancelBooking", async () => {
    cancelBooking.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCancelBookingMutation(), {
      wrapper,
    });
    result.current.mutate("b1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(cancelBooking).toHaveBeenCalledWith("b1", expect.anything());
  });
});
