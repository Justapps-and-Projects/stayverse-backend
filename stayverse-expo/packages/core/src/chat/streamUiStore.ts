import { create } from "zustand";

type StreamUiState = {
  ready: boolean;
  setReady: (ready: boolean) => void;
};

export const useStreamUiStore = create<StreamUiState>((set) => ({
  ready: false,
  setReady: (ready) => set({ ready }),
}));
