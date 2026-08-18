import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage, StorageKeys } from "../storage/mmkv";
import type { ServiceType } from "../types/auth";

export type SearchFilters = {
  query: string;
  city: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  guests: number;
  bedrooms: number | null;
  listingType: string | null;
};

type SearchState = {
  filters: SearchFilters;
  serviceType: ServiceType;
  setQuery: (query: string) => void;
  setCity: (city: string | null) => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  setGuests: (guests: number) => void;
  setBedrooms: (bedrooms: number | null) => void;
  setListingType: (listingType: string | null) => void;
  setServiceType: (serviceType: ServiceType) => void;
  resetFilters: () => void;
};

const defaultFilters: SearchFilters = {
  query: "",
  city: null,
  minPrice: null,
  maxPrice: null,
  guests: 1,
  bedrooms: null,
  listingType: null,
};

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      filters: defaultFilters,
      serviceType: "apartment",
      setQuery: (query) => set((s) => ({ filters: { ...s.filters, query } })),
      setCity: (city) => set((s) => ({ filters: { ...s.filters, city } })),
      setPriceRange: (minPrice, maxPrice) =>
        set((s) => ({ filters: { ...s.filters, minPrice, maxPrice } })),
      setGuests: (guests) => set((s) => ({ filters: { ...s.filters, guests } })),
      setBedrooms: (bedrooms) =>
        set((s) => ({ filters: { ...s.filters, bedrooms } })),
      setListingType: (listingType) =>
        set((s) => ({ filters: { ...s.filters, listingType } })),
      setServiceType: (serviceType) => set({ serviceType }),
      resetFilters: () => set({ filters: defaultFilters }),
    }),
    {
      name: StorageKeys.searchFilters,
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (s) => ({ filters: s.filters, serviceType: s.serviceType }),
    },
  ),
);
