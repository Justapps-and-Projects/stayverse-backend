import { create } from "zustand";

export type RideAdvertDraft = {
  title: string;
  description: string;
  price: string;
  vehicleType: string | null;
  imageUris: string[];
  amenityIds: string[];
  showAllAmenities: boolean;
};

const emptyRide = (): RideAdvertDraft => ({
  title: "",
  description: "",
  price: "",
  vehicleType: null,
  imageUris: [],
  amenityIds: [],
  showAllAmenities: false,
});

type RideAdvertState = {
  create: RideAdvertDraft;
  edit: RideAdvertDraft;
  setCreate: (partial: Partial<RideAdvertDraft>) => void;
  setEdit: (partial: Partial<RideAdvertDraft>) => void;
  resetCreate: () => void;
  resetEdit: () => void;
};

export const useRideAdvertStore = create<RideAdvertState>((set) => ({
  create: emptyRide(),
  edit: emptyRide(),
  setCreate: (partial) => set((s) => ({ create: { ...s.create, ...partial } })),
  setEdit: (partial) => set((s) => ({ edit: { ...s.edit, ...partial } })),
  resetCreate: () => set({ create: emptyRide() }),
  resetEdit: () => set({ edit: emptyRide() }),
}));
