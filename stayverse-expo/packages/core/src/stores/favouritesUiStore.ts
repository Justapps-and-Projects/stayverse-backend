import { create } from "zustand";
import type { HomeFeedTab } from "./homeStore";

type FavouritesUiState = {
  selectedCategory: HomeFeedTab;
  setSelectedCategory: (category: HomeFeedTab) => void;
  reset: () => void;
};

export const useFavouritesUiStore = create<FavouritesUiState>((set) => ({
  selectedCategory: "apartments",
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  reset: () => set({ selectedCategory: "apartments" }),
}));
