import { beforeEach, describe, expect, it } from "vitest";
import { useOnboardingStore } from "./onboardingStore";
import { useSearchStore } from "./searchStore";

describe("persist-capable stores", () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
    useOnboardingStore.setState({ isHydrated: true });
    useSearchStore.getState().resetFilters();
    useSearchStore.setState({ serviceType: "apartment" });
  });

  it("onboarding completeOnboarding survives setState round-trip", () => {
    useOnboardingStore.getState().completeOnboarding();
    expect(useOnboardingStore.getState().hasSeenOnboarding).toBe(true);
    expect(useOnboardingStore.getState().hasPickedExperience).toBe(true);

    // Simulate rehydration applying persisted partial state
    useOnboardingStore.setState({
      hasSeenOnboarding: true,
      hasPickedExperience: true,
      isHydrated: true,
    });
    expect(useOnboardingStore.getState().isHydrated).toBe(true);
  });

  it("search filters persist shape can be reapplied", () => {
    useSearchStore.getState().setQuery("lekki");
    useSearchStore.getState().setServiceType("ride");
    const snapshot = {
      filters: useSearchStore.getState().filters,
      serviceType: useSearchStore.getState().serviceType,
    };
    useSearchStore.getState().resetFilters();
    useSearchStore.setState(snapshot);
    expect(useSearchStore.getState().filters.query).toBe("lekki");
    expect(useSearchStore.getState().serviceType).toBe("ride");
  });
});
