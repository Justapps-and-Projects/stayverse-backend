import { beforeEach, describe, expect, it } from "vitest";
import { useSelfieStore } from "./selfieStore";

describe("useSelfieStore", () => {
  beforeEach(() => {
    useSelfieStore.getState().reset();
  });

  it("stores selfie uri", () => {
    useSelfieStore.getState().setUri("file:///selfie.jpg");
    expect(useSelfieStore.getState().uri).toBe("file:///selfie.jpg");
    useSelfieStore.getState().reset();
    expect(useSelfieStore.getState().uri).toBeNull();
  });
});
