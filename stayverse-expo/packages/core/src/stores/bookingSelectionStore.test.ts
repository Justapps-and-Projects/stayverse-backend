import { beforeEach, describe, expect, it } from "vitest";
import { useBookingSelectionStore } from "./bookingSelectionStore";
import type { BookingSummary } from "../api/catalog/types";

const sample: BookingSummary = {
  id: "b1",
  status: "pending",
  serviceType: "apartment",
  listingId: "l1",
  title: "Flat",
  address: "Lagos",
  description: "",
  imageUrl: null,
};

describe("useBookingSelectionStore", () => {
  beforeEach(() => {
    useBookingSelectionStore.getState().setSelected(null);
  });

  it("holds selected booking for detail screens", () => {
    expect(useBookingSelectionStore.getState().selected).toBeNull();
    useBookingSelectionStore.getState().setSelected(sample);
    expect(useBookingSelectionStore.getState().selected?.id).toBe("b1");
    useBookingSelectionStore.getState().setSelected(null);
    expect(useBookingSelectionStore.getState().selected).toBeNull();
  });
});
