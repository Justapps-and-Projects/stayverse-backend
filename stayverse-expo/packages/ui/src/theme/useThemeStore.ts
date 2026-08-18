import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ColorSchemeName } from "./tokens";
import { THEME_STORAGE_KEY, themeMmkvStorage } from "./mmkvStorage";

export type ThemeMode = "light" | "dark" | "system";

type ThemeState = {
  mode: ThemeMode;
  scheme: ColorSchemeName;
  systemScheme: ColorSchemeName;
  setMode: (mode: ThemeMode) => void;
  setSystemScheme: (scheme: ColorSchemeName) => void;
  toggle: () => void;
};

function resolveScheme(mode: ThemeMode, systemScheme: ColorSchemeName): ColorSchemeName {
  if (mode === "system") return systemScheme;
  return mode;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "light",
      scheme: "light",
      systemScheme: "light",
      setMode: (mode) => {
        set({ mode, scheme: resolveScheme(mode, get().systemScheme) });
      },
      setSystemScheme: (systemScheme) => {
        set({ systemScheme, scheme: resolveScheme(get().mode, systemScheme) });
      },
      toggle: () => {
        const next: ThemeMode = get().scheme === "light" ? "dark" : "light";
        set({ mode: next, scheme: next });
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => themeMmkvStorage),
      partialize: (s) => ({ mode: s.mode }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.scheme = resolveScheme(state.mode, state.systemScheme);
      },
    },
  ),
);
