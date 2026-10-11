import { FlatList, StyleSheet, View } from "react-native";
import type { CatalogServiceType, ListingSummary } from "@stayverse/core";
import { LottieEmptyState, spacing } from "@stayverse/ui";
import { ChefListingCard, ServiceListingCard } from "./ListingCards";

type Props = {
  items: ListingSummary[];
  kind: CatalogServiceType;
};

/** Horizontal recommendation / newly listed row. */
export function HorizontalListingRow({ items, kind }: Props) {
  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <LottieEmptyState
          kind={kind === "chef" ? "chefs" : kind === "ride" ? "rides" : "apartment"}
          title={
            kind === "chef"
              ? "No chefs nearby"
              : kind === "ride"
                ? "No cars nearby"
                : "No apartments found"
          }
          size={90}
        />
      </View>
    );
  }

  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      renderItem={({ item }) =>
        kind === "chef" ? (
          <ChefListingCard item={item} />
        ) : (
          <ServiceListingCard item={item} />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  empty: {
    paddingVertical: spacing.md,
  },
});
