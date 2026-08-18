import { create } from "zustand";

export type HomeFeedTab = "apartments" | "rides" | "chefs";

type HomeState = {
  feedTab: HomeFeedTab;
  setFeedTab: (tab: HomeFeedTab) => void;
  reset: () => void;
};

export const useHomeStore = create<HomeState>((set) => ({
  feedTab: "apartments",
  setFeedTab: (feedTab) => set({ feedTab }),
  reset: () => set({ feedTab: "apartments" }),
}));
