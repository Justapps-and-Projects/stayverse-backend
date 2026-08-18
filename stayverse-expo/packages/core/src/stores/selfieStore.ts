import { create } from "zustand";

type SelfieState = {
  uri: string | null;
  setUri: (uri: string | null) => void;
  reset: () => void;
};

export const useSelfieStore = create<SelfieState>((set) => ({
  uri: null,
  setUri: (uri) => set({ uri }),
  reset: () => set({ uri: null }),
}));
