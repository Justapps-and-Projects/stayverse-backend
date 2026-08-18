import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Stack, router, type Href } from "expo-router";
import { launchAgentStore, useOnboardingStore } from "@stayverse/core";
import { AppIcon, Button, Text, spacing } from "@stayverse/ui";

type Experience = "user" | "host";

/**
 * Flutter `PickAnExperience` — User vs Host cards.
 */
export default function PickExperienceScreen() {
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const [selected, setSelected] = useState<Experience>("user");

  const continueAsUser = () => {
    completeOnboarding();
    router.replace("/(auth)/login" as Href);
  };

  return (
    <>
      <Stack.Screen options={{ title: "", headerBackTitle: "Back" }} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.headline}>
          How would you like to experience Stayverse?
        </Text>

        <View style={{ height: 40 }} />

        <ExperienceCard
          selected={selected === "user"}
          onSelect={() => setSelected("user")}
          icon="person"
          title="I'm a User"
          description="Find verified apartments, private chefs, and premium rides — all in one apps."
          cta="Continue as User"
          onCta={continueAsUser}
        />

        <View style={{ height: 38 }} />

        <ExperienceCard
          selected={selected === "host"}
          onSelect={() => setSelected("host")}
          icon="work"
          title="I'm a Host"
          description="List your apartment, car, or kitchen and start earning from verified clients."
          cta="Continue as Host"
          onCta={() => {
            void launchAgentStore();
          }}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

function ExperienceCard({
  selected,
  onSelect,
  icon,
  title,
  description,
  cta,
  onCta,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: "person" | "work";
  title: string;
  description: string;
  cta: string;
  onCta: () => void;
}) {
  const accent = selected ? "#FBC036" : "#C4C4C4";
  const bg = selected ? "#FFF8E7" : "#F9F9F9";
  const titleColor = selected ? "#FBC036" : "#A4A4A4";
  const bodyColor = selected ? "#000000" : "#5A5957";
  const iconBg = selected ? "#FFFFFF" : "#F5F5F5";
  const iconColor = selected ? "#FBC036" : "#CBCBCB";

  return (
    <Pressable
      onPress={onSelect}
      style={[styles.card, { backgroundColor: bg, borderColor: accent }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg, borderColor: accent }]}>
        <AppIcon name={icon} size={39} color={iconColor} />
      </View>
      <View style={{ height: 10 }} />
      <Text style={[styles.cardTitle, { color: titleColor }]}>{title}</Text>
      <View style={{ height: 10 }} />
      <Text style={[styles.cardBody, { color: bodyColor }]}>{description}</Text>
      <View style={{ height: 24 }} />
      <Button
        label={cta}
        variant={selected ? "primary" : "secondary"}
        onPress={onCta}
        style={
          selected
            ? undefined
            : { backgroundColor: "#E3E3E2", borderColor: "#E3E3E2" }
        }
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 45,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  headline: {
    fontSize: 26,
    fontWeight: "500",
    color: "#000000",
    textAlign: "center",
    fontFamily: "NeueMontreal-Medium",
    lineHeight: 32,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 38,
    paddingVertical: 20,
    alignItems: "center",
  },
  iconWrap: {
    borderWidth: 1,
    borderRadius: 999,
    padding: 11,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "500",
    textAlign: "center",
    fontFamily: "NeueMontreal-Medium",
  },
  cardBody: {
    fontSize: 12,
    fontWeight: "400",
    textAlign: "center",
    fontFamily: "NeueMontreal-Regular",
    lineHeight: 18,
  },
});
