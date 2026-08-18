import { create } from "zustand";

export type DashboardTabIndex = number;

type DashboardState = {
  tabIndex: DashboardTabIndex;
  setTabIndex: (index: DashboardTabIndex) => void;
  reset: () => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  tabIndex: 0,
  setTabIndex: (tabIndex) => set({ tabIndex }),
  reset: () => set({ tabIndex: 0 }),
}));
