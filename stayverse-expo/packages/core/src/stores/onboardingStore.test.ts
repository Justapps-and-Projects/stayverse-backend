import { beforeEach, describe, expect, it } from "vitest";
import { useOnboardingStore } from "./onboardingStore";

describe("useOnboardingStore", () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
    useOnboardingStore.setState({ isHydrated: true });
  });

  it("tracks onboarding flags and completeOnboarding", () => {
    expect(useOnboardingStore.getState().hasSeenOnboarding).toBe(false);
    useOnboardingStore.getState().setHasSeenOnboarding(true);
    useOnboardingStore.getState().setHasPickedExperience(true);
    expect(useOnboardingStore.getState().hasPickedExperience).toBe(true);

    useOnboardingStore.getState().reset();
    useOnboardingStore.getState().completeOnboarding();
    const s = useOnboardingStore.getState();
    expect(s.hasSeenOnboarding).toBe(true);
    expect(s.hasPickedExperience).toBe(true);

    useOnboardingStore.getState().setHydrated(false);
    expect(useOnboardingStore.getState().isHydrated).toBe(false);
  });
});
