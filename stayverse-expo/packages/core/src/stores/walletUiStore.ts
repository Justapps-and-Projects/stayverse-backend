import { create } from "zustand";

type WalletUiState = {
  showBalance: boolean;
  selectedBankId: string | null;
  withdrawAmount: string;
  toggleBalance: () => void;
  setShowBalance: (showBalance: boolean) => void;
  setSelectedBankId: (id: string | null) => void;
  setWithdrawAmount: (amount: string) => void;
  reset: () => void;
};

export const useWalletUiStore = create<WalletUiState>((set) => ({
  /** Flutter default: balance hidden (`****`). */
  showBalance: false,
  selectedBankId: null,
  withdrawAmount: "",
  toggleBalance: () => set((s) => ({ showBalance: !s.showBalance })),
  setShowBalance: (showBalance) => set({ showBalance }),
  setSelectedBankId: (selectedBankId) => set({ selectedBankId }),
  setWithdrawAmount: (withdrawAmount) => set({ withdrawAmount }),
  reset: () =>
    set({ showBalance: false, selectedBankId: null, withdrawAmount: "" }),
}));
