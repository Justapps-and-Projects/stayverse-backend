import { beforeEach, describe, expect, it } from "vitest";
import { useProfileUiStore } from "./profileUiStore";

describe("useProfileUiStore", () => {
  beforeEach(() => {
    useProfileUiStore.getState().reset();
  });

  it("toggles editing", () => {
    useProfileUiStore.getState().setEditing(true);
    expect(useProfileUiStore.getState().isEditing).toBe(true);
    useProfileUiStore.getState().reset();
    expect(useProfileUiStore.getState().isEditing).toBe(false);
  });
});
