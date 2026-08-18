import { create } from "zustand";
import {
  DEFAULT_MAP_LOCATION,
  type StayverseCoords,
} from "../location/location";

export type MapCamera = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type MapMarkerData = {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  subtitle?: string;
  /** Search price bubble label e.g. "₦25,000" */
  priceLabel?: string;
};

type MapState = {
  camera: MapCamera;
  selectedMarkerId: string | null;
  markers: MapMarkerData[];
  liveLocation: StayverseCoords | null;
  setCamera: (camera: Partial<MapCamera>) => void;
  setSelectedMarkerId: (id: string | null) => void;
  setMarkers: (markers: MapMarkerData[]) => void;
  setLiveLocation: (coords: StayverseCoords | null) => void;
  reset: () => void;
};

const defaultCamera: MapCamera = {
  latitude: DEFAULT_MAP_LOCATION.latitude,
  longitude: DEFAULT_MAP_LOCATION.longitude,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

export const useMapStore = create<MapState>((set) => ({
  camera: defaultCamera,
  selectedMarkerId: null,
  markers: [],
  liveLocation: null,
  setCamera: (partial) => set((s) => ({ camera: { ...s.camera, ...partial } })),
  setSelectedMarkerId: (selectedMarkerId) => set({ selectedMarkerId }),
  setMarkers: (markers) => set({ markers }),
  setLiveLocation: (liveLocation) => set({ liveLocation }),
  reset: () =>
    set({
      camera: defaultCamera,
      selectedMarkerId: null,
      markers: [],
      liveLocation: null,
    }),
}));
