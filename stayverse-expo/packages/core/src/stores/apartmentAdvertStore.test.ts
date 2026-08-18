import { beforeEach, describe, expect, it } from "vitest";
import { useApartmentAdvertStore } from "./apartmentAdvertStore";

describe("useApartmentAdvertStore", () => {
  beforeEach(() => {
    useApartmentAdvertStore.getState().resetCreate();
    useApartmentAdvertStore.getState().resetEdit();
  });

  it("updates create and edit drafts", () => {
    useApartmentAdvertStore.getState().setCreate({ title: "New", price: "10000" });
    expect(useApartmentAdvertStore.getState().create.title).toBe("New");
    useApartmentAdvertStore.getState().setEdit({ title: "Edit" });
    expect(useApartmentAdvertStore.getState().edit.title).toBe("Edit");
    useApartmentAdvertStore.getState().resetCreate();
    expect(useApartmentAdvertStore.getState().create.title).toBe("");
  });
});
