import { create } from "zustand";

/** Flutter `BookingStatus` — tab filter for `GET /booking/user`. */
export type BookingsFilter = "accepted" | "completed" | "pending" | "rejected";

type BookingsUiState = {
  filter: BookingsFilter;
  setFilter: (filter: BookingsFilter) => void;
  reset: () => void;
};

export const useBookingsUiStore = create<BookingsUiState>((set) => ({
  filter: "accepted",
  setFilter: (filter) => set({ filter }),
  reset: () => set({ filter: "accepted" }),
}));
