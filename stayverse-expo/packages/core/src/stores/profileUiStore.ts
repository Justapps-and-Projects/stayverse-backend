import { create } from "zustand";

type ProfileUiState = {
  isEditing: boolean;
  setEditing: (isEditing: boolean) => void;
  reset: () => void;
};

export const useProfileUiStore = create<ProfileUiState>((set) => ({
  isEditing: false,
  setEditing: (isEditing) => set({ isEditing }),
  reset: () => set({ isEditing: false }),
}));
