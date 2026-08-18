import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage, StorageKeys } from "../storage/mmkv";

type OnboardingState = {
  /** False until persist rehydration finishes */
  isHydrated: boolean;
  hasSeenOnboarding: boolean;
  hasPickedExperience: boolean;
  setHasSeenOnboarding: (value: boolean) => void;
  setHasPickedExperience: (value: boolean) => void;
  /** User Continue as User / agent Get Started — skip onboarding next launch */
  completeOnboarding: () => void;
  reset: () => void;
  setHydrated: (value: boolean) => void;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      isHydrated: false,
      hasSeenOnboarding: false,
      hasPickedExperience: false,
      setHasSeenOnboarding: (hasSeenOnboarding) => set({ hasSeenOnboarding }),
      setHasPickedExperience: (hasPickedExperience) =>
        set({ hasPickedExperience }),
      completeOnboarding: () =>
        set({ hasSeenOnboarding: true, hasPickedExperience: true }),
      reset: () =>
        set({ hasSeenOnboarding: false, hasPickedExperience: false }),
      setHydrated: (isHydrated) => set({ isHydrated }),
    }),
    {
      name: StorageKeys.onboarding,
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (s) => ({
        hasSeenOnboarding: s.hasSeenOnboarding,
        hasPickedExperience: s.hasPickedExperience,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          useOnboardingStore.setState({ isHydrated: true });
          return;
        }
        useOnboardingStore.setState({ isHydrated: true });
      },
    },
  ),
);

/** Never leave AuthGate spinning if MMKV rehydration stalls. */
const ONBOARDING_HYDRATION_TIMEOUT_MS = 3000;
setTimeout(() => {
  if (!useOnboardingStore.getState().isHydrated) {
    useOnboardingStore.setState({ isHydrated: true });
  }
}, ONBOARDING_HYDRATION_TIMEOUT_MS);

useOnboardingStore.persist.onFinishHydration(() => {
  if (!useOnboardingStore.getState().isHydrated) {
    useOnboardingStore.setState({ isHydrated: true });
  }
});
