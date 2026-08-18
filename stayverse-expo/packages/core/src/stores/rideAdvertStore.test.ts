import { beforeEach, describe, expect, it } from "vitest";
import { useRideAdvertStore } from "./rideAdvertStore";

describe("useRideAdvertStore", () => {
  beforeEach(() => {
    useRideAdvertStore.getState().resetCreate();
    useRideAdvertStore.getState().resetEdit();
  });

  it("updates create and edit drafts", () => {
    useRideAdvertStore.getState().setCreate({ title: "SUV", vehicleType: "suv" });
    expect(useRideAdvertStore.getState().create.vehicleType).toBe("suv");
    useRideAdvertStore.getState().setEdit({ price: "8000" });
    expect(useRideAdvertStore.getState().edit.price).toBe("8000");
    useRideAdvertStore.getState().resetEdit();
    expect(useRideAdvertStore.getState().edit.price).toBe("");
  });
});
