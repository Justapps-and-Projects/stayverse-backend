import { beforeEach, describe, expect, it } from "vitest";
import { useFavouritesUiStore } from "./favouritesUiStore";

describe("useFavouritesUiStore", () => {
  beforeEach(() => {
    useFavouritesUiStore.getState().reset();
  });

  it("switches favourite category", () => {
    useFavouritesUiStore.getState().setSelectedCategory("chefs");
    expect(useFavouritesUiStore.getState().selectedCategory).toBe("chefs");
    useFavouritesUiStore.getState().reset();
    expect(useFavouritesUiStore.getState().selectedCategory).toBe("apartments");
  });
});
