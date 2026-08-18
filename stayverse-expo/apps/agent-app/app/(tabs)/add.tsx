import { StyleSheet, View } from "react-native";
import { router, type Href } from "expo-router";
import { useAuthStore, type ServiceType } from "@stayverse/core";
import { Button, Text, spacing, useTheme } from "@stayverse/ui";

function copyFor(serviceType: ServiceType | null) {
  switch (serviceType) {
    case "ride":
      return {
        title: "Add Vehicle",
        subtitle: "Please fill in this form to make a post",
        cta: "New Advert",
        href: "/listings/create-ride" as const,
      };
    case "chef":
      return {
        title: "Chef Profile",
        subtitle: "Set up your culinary profile",
        cta: "Continue",
        href: "/listings/create-chef" as const,
      };
    case "apartment":
    default:
      return {
        title: "New Advert",
        subtitle: "Please fill in this form to make a post",
        cta: "New Advert",
        href: "/listings/create-apartment" as const,
      };
  }
}

/** Flutter middle tab entry — apartment / ride / chef create forms. */
export default function AddTab() {
  const { colors } = useTheme();
  const serviceType = useAuthStore((s) => s.serviceType);
  const copy = copyFor(serviceType);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>
        {copy.title}
      </Text>
      <Text muted style={styles.sub}>
        {copy.subtitle}
      </Text>
      <Button
        label={copy.cta}
        variant="dark"
        onPress={() => router.push(copy.href as Href)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
  },
  sub: {
    marginBottom: spacing.lg,
  },
});
