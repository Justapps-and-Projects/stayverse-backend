import { Pressable, StyleSheet, View } from "react-native";
import { router, type Href } from "expo-router";
import { useHomeStore, useSearchStore, type HomeFeedTab } from "@stayverse/core";
import { AppIcon, Text, palette, spacing, useTheme } from "@stayverse/ui";
import { HOME_TABS } from "./constants";

function serviceTypeFor(tab: HomeFeedTab) {
  if (tab === "rides") return "ride" as const;
  if (tab === "chefs") return "chef" as const;
  return "apartment" as const;
}

/** Figma home search row: location field plus gold filter button. */
export function DiscoverSearchBar() {
  const { colors } = useTheme();
  const feedTab = useHomeStore((s) => s.feedTab);
  const setServiceType = useSearchStore((s) => s.setServiceType);
  const meta = HOME_TABS.find((t) => t.key === feedTab) ?? HOME_TABS[0]!;

  const openSearch = () => {
    setServiceType(serviceTypeFor(feedTab));
    router.push("/search" as Href);
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={openSearch}
        style={[styles.bar, { backgroundColor: colors.card }]}
        accessibilityRole="search"
        accessibilityLabel={meta.hint}
      >
        <AppIcon name="location" size={14} color="#D1D1D6" />
        <Text style={styles.hint}>{meta.hint}</Text>
      </Pressable>
      <Pressable
        onPress={openSearch}
        style={styles.filter}
        accessibilityRole="button"
        accessibilityLabel="Filter"
      >
        <AppIcon name="filter" size={22} color={palette.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bar: {
    flex: 1,
    height: 35,
    borderRadius: 5,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  hint: {
    flex: 1,
    fontSize: 12,
    color: "#D1D1D6",
    fontFamily: "NeueMontreal-Regular",
  },
  filter: {
    width: 35,
    height: 35,
    borderRadius: 5,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.68,
    shadowRadius: 4,
    elevation: 3,
  },
});
