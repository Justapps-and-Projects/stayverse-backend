/**
 * User-app integration flows — import stores/validators directly (avoid core barrel native deps).
 */
import { useAuthStore } from "../../../packages/core/src/stores/authStore";
import { useBookingSelectionStore } from "../../../packages/core/src/stores/bookingSelectionStore";
import { validateMoney } from "../../../packages/core/src/validation/validators";
import type { BookingSummary } from "../../../packages/core/src/api/catalog/types";

const sampleBooking: BookingSummary = {
  id: "b-user-1",
  status: "accepted",
  serviceType: "apartment",
  listingId: "l1",
  title: "Lekki Flat",
  address: "Lagos",
  description: "",
  imageUrl: null,
};

describe("user-app integration", () => {
  beforeEach(() => {
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

  it("login success sets session on auth store", () => {
    useAuthStore.getState().login({
      accessToken: "user-tok",
      chatToken: null,
      user: {
        id: "u1",
        email: "guest@stayverse.com",
        name: "Guest",
        isEmailVerified: true,
      },
      serviceType: null,
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe("user-tok");
  });

  it("bookings list selection populates detail store", () => {
    useBookingSelectionStore.getState().setSelected(sampleBooking);
    expect(useBookingSelectionStore.getState().selected?.id).toBe("b-user-1");
    expect(useBookingSelectionStore.getState().selected?.title).toBe(
      "Lekki Flat",
    );
  });

  it("wallet add-funds validation blocks invalid amounts", () => {
    const opts = { minAllowed: 100, maxAllowed: 1_000_000 };
    expect(validateMoney("", opts)).toBe("Amount must not be empty");
    expect(validateMoney("50", opts)).toMatch(/at least/i);
    expect(validateMoney("2500", opts)).toBeNull();
  });
});
