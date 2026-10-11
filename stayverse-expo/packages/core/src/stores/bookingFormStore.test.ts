import { beforeEach, describe, expect, it } from "vitest";
import { useBookingFormStore } from "./bookingFormStore";

describe("useBookingFormStore", () => {
  beforeEach(() => {
    useBookingFormStore.getState().resetApartment();
    useBookingFormStore.getState().resetRide();
  });

  it("merges apartment draft and resets", () => {
    useBookingFormStore.getState().setApartmentDraft({
      listingId: "a1",
      title: "Condo",
      nights: 2,
      totalPrice: 40_000,
    });
    const apt = useBookingFormStore.getState().apartment;
    expect(apt.listingId).toBe("a1");
    expect(apt.nights).toBe(2);
    useBookingFormStore.getState().resetApartment();
    expect(useBookingFormStore.getState().apartment.listingId).toBeNull();
  });

  it("merges ride draft and resets", () => {
    useBookingFormStore.getState().setRideDraft({
      listingId: "r1",
      pickupAddress: "Airport",
      totalHours: 4,
    });
    const ride = useBookingFormStore.getState().ride;
    expect(ride.pickupAddress).toBe("Airport");
    expect(ride.totalHours).toBe(4);
    useBookingFormStore.getState().resetRide();
    expect(useBookingFormStore.getState().ride.pickupAddress).toBe("");
  });

  it("stores apartment stay coordinates", () => {
    useBookingFormStore.getState().setApartmentDraft({
      listingId: "a1",
      latitude: 6.45,
      longitude: 3.39,
    });
    const apt = useBookingFormStore.getState().apartment;
    expect(apt.latitude).toBe(6.45);
    expect(apt.longitude).toBe(3.39);
  });
});
