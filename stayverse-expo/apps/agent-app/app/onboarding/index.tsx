import { router, Stack, type Href } from "expo-router";
import { chefPng, shortletPng } from "@stayverse/assets";
import { useOnboardingStore } from "@stayverse/core";
import { OnboardingCarousel } from "@stayverse/ui";

const SLIDES = [
  {
    image: shortletPng,
    title: "Easily list and manage your \nproperties.",
  },
  {
    image: chefPng,
    title: "Connect with guests who \nneed professional chefs.",
  },
];

/**
 * Flutter agent `OnboardingScreen` → Login (persist skip).
 */
export default function OnboardingScreen() {
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingCarousel
        slides={SLIDES}
        ctaVariant="dark"
        legalWeight="400"
        onComplete={() => {
          completeOnboarding();
          router.replace("/(auth)/login" as Href);
        }}
      />
    </>
  );
}
