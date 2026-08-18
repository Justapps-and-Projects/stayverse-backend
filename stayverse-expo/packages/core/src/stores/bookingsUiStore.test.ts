import { beforeEach, describe, expect, it } from "vitest";
import { useBookingsUiStore } from "./bookingsUiStore";

describe("useBookingsUiStore", () => {
  beforeEach(() => {
    useBookingsUiStore.getState().reset();
  });

  it("defaults to accepted and updates filter", () => {
    expect(useBookingsUiStore.getState().filter).toBe("accepted");
    useBookingsUiStore.getState().setFilter("pending");
    expect(useBookingsUiStore.getState().filter).toBe("pending");
    useBookingsUiStore.getState().reset();
    expect(useBookingsUiStore.getState().filter).toBe("accepted");
  });
});
