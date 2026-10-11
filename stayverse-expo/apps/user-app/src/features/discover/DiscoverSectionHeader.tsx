import { Pressable, StyleSheet, View } from "react-native";
import { router, type Href } from "expo-router";
import { useHomeStore, useSearchStore, type HomeFeedTab } from "@stayverse/core";
import { Text, spacing, useTheme } from "@stayverse/ui";

function serviceTypeFor(tab: HomeFeedTab) {
  if (tab === "rides") return "ride" as const;
  if (tab === "chefs") return "chef" as const;
  return "apartment" as const;
}

/** Flutter `SectionHeader` with View All → search. */
export function DiscoverSectionHeader({ title }: { title: string }) {
  const { colors } = useTheme();
  const feedTab = useHomeStore((s) => s.feedTab);
  const setServiceType = useSearchStore((s) => s.setServiceType);

  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Pressable
        onPress={() => {
          setServiceType(serviceTypeFor(feedTab));
          router.push("/search" as Href);
        }}
        accessibilityRole="button"
        accessibilityLabel={`View all ${title}`}
      >
        <Text style={[styles.viewAll, { color: colors.primary }]}>View all</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  title: {
    fontSize: 14,
    fontFamily: "NeueMontreal-Medium",
  },
  viewAll: {
    fontSize: 12,
    fontFamily: "NeueMontreal-Regular",
  },
});
