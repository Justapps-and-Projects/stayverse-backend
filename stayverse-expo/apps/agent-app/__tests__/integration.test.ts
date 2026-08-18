/**
 * Agent-app integration — selection, add-tab routing, logout.
 */
import { router } from "expo-router";
import { useAuthStore } from "../../../packages/core/src/stores/authStore";
import { useBookingSelectionStore } from "../../../packages/core/src/stores/bookingSelectionStore";
import type { BookingSummary } from "../../../packages/core/src/api/catalog/types";
import type { ServiceType } from "../../../packages/core/src/types/auth";

const mockMutateAsync = jest.fn();

function addHrefFor(serviceType: ServiceType | null): string {
  switch (serviceType) {
    case "ride":
      return "/listings/create-ride";
    case "chef":
      return "/listings/create-chef";
    case "apartment":
    default:
      return "/listings/create-apartment";
  }
}

const pendingBooking: BookingSummary = {
  id: "b-agent-1",
  status: "pending",
  serviceType: "apartment",
  listingId: "l1",
  title: "Guest stay",
  address: "Abuja",
  description: "",
  imageUrl: null,
};

describe("agent-app integration", () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    (router.push as jest.Mock).mockClear();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      chatToken: null,
      serviceType: null,
      isAuthenticated: false,
      isHydrated: true,
      isLoading: false,
    });
    useBookingSelectionStore.getState().setSelected(null);
  });

  it("discover booking row selects booking and accept mutation can run", async () => {
    useBookingSelectionStore.getState().setSelected(pendingBooking);
    expect(useBookingSelectionStore.getState().selected?.id).toBe("b-agent-1");

    mockMutateAsync.mockResolvedValue(undefined);
    await mockMutateAsync({
      bookingId: "b-agent-1",
      status: "accepted",
    });
    expect(mockMutateAsync).toHaveBeenCalledWith({
      bookingId: "b-agent-1",
      status: "accepted",
    });
  });

  it("add-tab routes by serviceType", () => {
    useAuthStore.setState({ serviceType: "ride" });
    const href = addHrefFor(useAuthStore.getState().serviceType);
    expect(href).toBe("/listings/create-ride");
    router.push(href as never);
    expect(router.push).toHaveBeenCalledWith("/listings/create-ride");

    useAuthStore.setState({ serviceType: "chef" });
    expect(addHrefFor(useAuthStore.getState().serviceType)).toBe(
      "/listings/create-chef",
    );
    useAuthStore.setState({ serviceType: "apartment" });
    expect(addHrefFor(useAuthStore.getState().serviceType)).toBe(
      "/listings/create-apartment",
    );
  });

  it("logout clears auth", () => {
    useAuthStore.getState().login({
      accessToken: "a",
      chatToken: null,
      user: {
        id: "1",
        email: "agent@stayverse.com",
        name: "Agent",
        isEmailVerified: true,
      },
      serviceType: "apartment",
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
