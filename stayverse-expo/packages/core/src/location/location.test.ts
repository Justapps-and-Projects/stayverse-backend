import { describe, expect, it } from "vitest";
import {
  coordsFromGeoJson,
  DEFAULT_MAP_LOCATION,
  distanceBetweenMeters,
} from "./coords";

describe("location coords helpers", () => {
  it("uses Flutter default Ikeja coords", () => {
    expect(DEFAULT_MAP_LOCATION.latitude).toBeCloseTo(6.6018);
    expect(DEFAULT_MAP_LOCATION.longitude).toBeCloseTo(3.3515);
  });

  it("swaps GeoJSON [lng, lat] to map coords", () => {
    expect(coordsFromGeoJson([3.3515, 6.6018])).toEqual({
      latitude: 6.6018,
      longitude: 3.3515,
    });
  });

  it("computes distance between nearby points", () => {
    const a = { latitude: 6.6018, longitude: 3.3515 };
    const b = { latitude: 6.6028, longitude: 3.3515 };
    const meters = distanceBetweenMeters(a, b);
    expect(meters).toBeGreaterThan(50);
    expect(meters).toBeLessThan(200);
  });
});
