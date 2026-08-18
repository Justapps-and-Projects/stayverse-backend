import { router, Stack, type Href } from "expo-router";
import { cabPng, chefPng, shortletPng } from "@stayverse/assets";
import { OnboardingCarousel } from "@stayverse/ui";

const SLIDES = [
  {
    image: shortletPng,
    title: "Find the perfect apartment\nfor your stay.",
  },
  {
    image: chefPng,
    title: "Hire professional chefs to\nenhance your experience",
  },
  {
    image: cabPng,
    title: "Book vehicles to explore\nfreely.",
  },
];

/**
 * Flutter user `OnboardingScreen` → PickAnExperience.
 */
export default function OnboardingScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingCarousel
        slides={SLIDES}
        onComplete={() => router.push("/pick-experience" as Href)}
      />
    </>
  );
}
