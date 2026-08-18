import { beforeEach, describe, expect, it } from "vitest";
import { useHomeStore } from "./homeStore";

describe("useHomeStore", () => {
  beforeEach(() => {
    useHomeStore.getState().reset();
  });

  it("switches feed tabs", () => {
    expect(useHomeStore.getState().feedTab).toBe("apartments");
    useHomeStore.getState().setFeedTab("rides");
    expect(useHomeStore.getState().feedTab).toBe("rides");
    useHomeStore.getState().reset();
    expect(useHomeStore.getState().feedTab).toBe("apartments");
  });
});
