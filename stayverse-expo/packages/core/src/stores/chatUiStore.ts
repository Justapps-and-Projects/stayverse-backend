import { create } from "zustand";

type ChatUiState = {
  isBusy: boolean;
  activeChannelId: string | null;
  setBusy: (isBusy: boolean) => void;
  setActiveChannelId: (id: string | null) => void;
  reset: () => void;
};

/** Local messaging UI flags — Stream Chat realtime is Phase 7. */
export const useChatUiStore = create<ChatUiState>((set) => ({
  isBusy: false,
  activeChannelId: null,
  setBusy: (isBusy) => set({ isBusy }),
  setActiveChannelId: (activeChannelId) => set({ activeChannelId }),
  reset: () => set({ isBusy: false, activeChannelId: null }),
}));
