import { create } from "zustand";

export type AdvertDraft = {
  title: string;
  description: string;
  price: string;
  address: string;
  imageUris: string[];
  amenityIds: string[];
  apartmentType: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  showAllAmenities: boolean;
};

const emptyAdvert = (): AdvertDraft => ({
  title: "",
  description: "",
  price: "",
  address: "",
  imageUris: [],
  amenityIds: [],
  apartmentType: null,
  checkInTime: null,
  checkOutTime: null,
  showAllAmenities: false,
});

type ApartmentAdvertState = {
  create: AdvertDraft;
  edit: AdvertDraft;
  setCreate: (partial: Partial<AdvertDraft>) => void;
  setEdit: (partial: Partial<AdvertDraft>) => void;
  resetCreate: () => void;
  resetEdit: () => void;
};

export const useApartmentAdvertStore = create<ApartmentAdvertState>((set) => ({
  create: emptyAdvert(),
  edit: emptyAdvert(),
  setCreate: (partial) => set((s) => ({ create: { ...s.create, ...partial } })),
  setEdit: (partial) => set((s) => ({ edit: { ...s.edit, ...partial } })),
  resetCreate: () => set({ create: emptyAdvert() }),
  resetEdit: () => set({ edit: emptyAdvert() }),
}));
