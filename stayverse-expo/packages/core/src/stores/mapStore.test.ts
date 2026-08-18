import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../location/location", () => ({
  DEFAULT_MAP_LOCATION: {
    latitude: 6.6018,
    longitude: 3.3515,
  },
}));

import { useMapStore } from "./mapStore";

describe("useMapStore", () => {
  beforeEach(() => {
    useMapStore.getState().reset();
  });

  it("updates camera, markers, and live location", () => {
    useMapStore.getState().setCamera({ latitude: 6.5, longitude: 3.3 });
    useMapStore.getState().setSelectedMarkerId("m1");
    useMapStore.getState().setMarkers([
      { id: "m1", latitude: 6.5, longitude: 3.3, title: "Stay" },
    ]);
    useMapStore.getState().setLiveLocation({ latitude: 6.51, longitude: 3.31 });

    const s = useMapStore.getState();
    expect(s.camera.latitude).toBe(6.5);
    expect(s.selectedMarkerId).toBe("m1");
    expect(s.markers).toHaveLength(1);
    expect(s.liveLocation?.latitude).toBe(6.51);

    useMapStore.getState().reset();
    expect(useMapStore.getState().markers).toEqual([]);
    expect(useMapStore.getState().selectedMarkerId).toBeNull();
  });
});
