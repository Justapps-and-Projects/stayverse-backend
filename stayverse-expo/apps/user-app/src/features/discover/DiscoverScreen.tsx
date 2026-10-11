import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHomeStore } from "@stayverse/core";
import { spacing, useTheme } from "@stayverse/ui";
import { DiscoverCategoryTabs } from "./DiscoverCategoryTabs";
import { DiscoverFeedTab } from "./DiscoverFeedTab";
import { DiscoverHeader } from "./DiscoverHeader";
import { DiscoverSearchBar } from "./DiscoverSearchBar";

/** Flutter `HomePage` — greeting, search, category tabs, listings. */
export function DiscoverScreen() {
  const { colors } = useTheme();
  const feedTab = useHomeStore((s) => s.feedTab);

  return (
    <SafeAreaView
      style={[styles.wrap, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <DiscoverHeader />
      <View style={styles.gap} />
      <DiscoverSearchBar />
      <View style={styles.gap} />
      <DiscoverCategoryTabs />
      <View style={styles.feed}>
        <DiscoverFeedTab tab={feedTab} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  gap: {
    height: spacing.md,
  },
  feed: {
    flex: 1,
    marginTop: spacing.sm,
  },
});
