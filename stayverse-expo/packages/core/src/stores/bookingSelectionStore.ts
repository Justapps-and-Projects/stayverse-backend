import { create } from "zustand";
import type { BookingSummary } from "../api/catalog/types";

type BookingSelectionState = {
  selected: BookingSummary | null;
  setSelected: (booking: BookingSummary | null) => void;
};

/** Pass booking payload into detail screens (Flutter navigates with Booking args). */
export const useBookingSelectionStore = create<BookingSelectionState>((set) => ({
  selected: null,
  setSelected: (selected) => set({ selected }),
}));
