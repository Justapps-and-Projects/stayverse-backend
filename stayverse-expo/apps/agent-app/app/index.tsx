import { useEffect } from "react";
import { Redirect, type Href } from "expo-router";
import { StyleSheet, View } from "react-native";
import { StayverseLoader } from "@stayverse/ui";
import { useAuthStore, useOnboardingStore } from "@stayverse/core";

/**
 * AuthGate — onboarding → login → tabs.
 * Includes a client-side hydration timeout so a stalled SecureStore/MMKV
 * rehydration cannot leave the user on an infinite spinner.
 */
export default function AuthGate() {
  const authHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const onboardingHydrated = useOnboardingStore((s) => s.isHydrated);
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!useAuthStore.getState().isHydrated) {
        useAuthStore.setState({ isHydrated: true, isLoading: false });
      }
      if (!useOnboardingStore.getState().isHydrated) {
        useOnboardingStore.setState({ isHydrated: true });
      }
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  if (!authHydrated || !onboardingHydrated) {
    return (
      <View style={styles.boot}>
        <StayverseLoader color="#2C2C2C" size={64} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href={"/(tabs)" as Href} />;
  }

  if (!hasSeenOnboarding) {
    return <Redirect href={"/onboarding" as Href} />;
  }

  return <Redirect href={"/(auth)/login" as Href} />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
});
