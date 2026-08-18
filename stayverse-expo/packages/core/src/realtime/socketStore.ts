import { create } from "zustand";
import type { SocketConnectionStatus } from "./types";

type SocketUiState = {
  status: SocketConnectionStatus;
  lastError: string | null;
  setStatus: (status: SocketConnectionStatus, lastError?: string | null) => void;
};

export const useSocketStore = create<SocketUiState>((set) => ({
  status: "disconnected",
  lastError: null,
  setStatus: (status, lastError = null) => set({ status, lastError }),
}));
