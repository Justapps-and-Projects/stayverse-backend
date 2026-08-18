import { describe, expect, it } from "vitest";
import { MediaConstraints } from "./mediaConstraints";

describe("MediaConstraints (Flutter parity)", () => {
  it("matches profile imageQuality 85", () => {
    expect(MediaConstraints.profileImageQuality).toBe(85);
  });

  it("matches upload JPEG quality 80 and min edge 1440", () => {
    expect(MediaConstraints.uploadJpegQuality).toBe(80);
    expect(MediaConstraints.uploadMinEdge).toBe(1440);
  });

  it("matches agent listing multi-pick bounds", () => {
    expect(MediaConstraints.listingMinImages).toBe(2);
    expect(MediaConstraints.listingMaxImages).toBe(12);
    expect(MediaConstraints.listingMaxBytes).toBe(5 * 1024 * 1024);
    expect([...MediaConstraints.listingExtensions]).toEqual([
      "jpg",
      "png",
      "jpeg",
      "gif",
    ]);
  });
});
