import { Pressable, StyleSheet, View } from "react-native";
import { useHomeStore, type HomeFeedTab } from "@stayverse/core";
import { AppIcon, Text, useTheme } from "@stayverse/ui";
import { HOME_TABS } from "./constants";

/** Figma home category tiles: Apartments, Chefs, Rides. */
export function DiscoverCategoryTabs() {
  const { colors } = useTheme();
  const feedTab = useHomeStore((s) => s.feedTab);
  const setFeedTab = useHomeStore((s) => s.setFeedTab);

  return (
    <View style={styles.row}>
      {HOME_TABS.map((tab) => {
        const selected = tab.key === feedTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => setFeedTab(tab.key as HomeFeedTab)}
            style={[
              styles.tab,
              selected
                ? {
                    backgroundColor: "rgba(251,192,54,0.2)",
                    borderColor: "rgba(251,192,54,0.2)",
                  }
                : {
                    backgroundColor: "#F7F7F7",
                    borderColor: "#F4F4F4",
                  },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            <AppIcon
              name={tab.icon}
              size={22}
              color={selected ? colors.primary : "#D1D1D6"}
            />
            <Text
              style={[styles.label, { color: selected ? colors.primary : "#D1D1D6" }]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 18,
    gap: 16,
  },
  tab: {
    width: 54,
    height: 54,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 6,
  },
  label: {
    marginTop: 2,
    fontSize: 8,
    fontFamily: "NeueMontreal-Medium",
  },
});
