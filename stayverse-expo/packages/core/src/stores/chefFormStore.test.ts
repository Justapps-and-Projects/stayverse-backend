import { beforeEach, describe, expect, it } from "vitest";
import { useChefFormStore } from "./chefFormStore";

describe("useChefFormStore", () => {
  beforeEach(() => {
    useChefFormStore.getState().resetCreate();
    useChefFormStore.getState().resetEdit();
  });

  it("updates create and edit drafts", () => {
    useChefFormStore.getState().setCreate({ bio: "Cook", specialtyIds: ["s1"] });
    expect(useChefFormStore.getState().create.bio).toBe("Cook");
    useChefFormStore.getState().setEdit({ showAllSpecialties: true });
    expect(useChefFormStore.getState().edit.showAllSpecialties).toBe(true);
    useChefFormStore.getState().resetCreate();
    expect(useChefFormStore.getState().create.bio).toBe("");
  });
});
