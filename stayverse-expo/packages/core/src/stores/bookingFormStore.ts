import { create } from "zustand";

/** Flutter apartment booking draft (date range). */
export type ApartmentBookingDraft = {
  listingId: string | null;
  title: string;
  address: string | null;
  latitude?: number | null;
  longitude?: number | null;
  startDate: string | null;
  endDate: string | null;
  nights: number;
  pricePerDay: number;
  apartmentFee: number;
  cautionFee: number;
  totalPrice: number;
};

/** Flutter ride booking draft (pickup / hours / security). */
export type RideBookingDraft = {
  listingId: string | null;
  title: string;
  pickupAddress: string;
  pickupPlaceId: string | null;
  pickupDateTime: string | null;
  totalHours: number;
  securityDetails: string[];
  notes: string;
  pricePerHour: number;
  rideFee: number;
  cautionFee: number;
  totalPrice: number;
};

type BookingFormState = {
  apartment: ApartmentBookingDraft;
  ride: RideBookingDraft;
  setApartmentDraft: (partial: Partial<ApartmentBookingDraft>) => void;
  setRideDraft: (partial: Partial<RideBookingDraft>) => void;
  resetApartment: () => void;
  resetRide: () => void;
};

const emptyApartment = (): ApartmentBookingDraft => ({
  listingId: null,
  title: "",
  address: null,
  latitude: null,
  longitude: null,
  startDate: null,
  endDate: null,
  nights: 0,
  pricePerDay: 0,
  apartmentFee: 0,
  cautionFee: 0,
  totalPrice: 0,
});

const emptyRide = (): RideBookingDraft => ({
  listingId: null,
  title: "",
  pickupAddress: "",
  pickupPlaceId: null,
  pickupDateTime: null,
  totalHours: 0,
  securityDetails: [],
  notes: "",
  pricePerHour: 0,
  rideFee: 0,
  cautionFee: 0,
  totalPrice: 0,
});

export const useBookingFormStore = create<BookingFormState>((set) => ({
  apartment: emptyApartment(),
  ride: emptyRide(),
  setApartmentDraft: (partial) =>
    set((s) => ({ apartment: { ...s.apartment, ...partial } })),
  setRideDraft: (partial) => set((s) => ({ ride: { ...s.ride, ...partial } })),
  resetApartment: () => set({ apartment: emptyApartment() }),
  resetRide: () => set({ ride: emptyRide() }),
}));
