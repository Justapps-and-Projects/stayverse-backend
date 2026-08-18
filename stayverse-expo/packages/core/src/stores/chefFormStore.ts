import { create } from "zustand";

export type ChefProfileDraft = {
  bio: string;
  specialtyIds: string[];
  showAllSpecialties: boolean;
};

const emptyChef = (): ChefProfileDraft => ({
  bio: "",
  specialtyIds: [],
  showAllSpecialties: false,
});

type ChefFormState = {
  create: ChefProfileDraft;
  edit: ChefProfileDraft;
  setCreate: (partial: Partial<ChefProfileDraft>) => void;
  setEdit: (partial: Partial<ChefProfileDraft>) => void;
  resetCreate: () => void;
  resetEdit: () => void;
};

export const useChefFormStore = create<ChefFormState>((set) => ({
  create: emptyChef(),
  edit: emptyChef(),
  setCreate: (partial) => set((s) => ({ create: { ...s.create, ...partial } })),
  setEdit: (partial) => set((s) => ({ edit: { ...s.edit, ...partial } })),
  resetCreate: () => set({ create: emptyChef() }),
  resetEdit: () => set({ edit: emptyChef() }),
}));
