import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { router, type Href } from "expo-router";
import {
  useCatalogNewestQuery,
  useCatalogRecommendationsQuery,
  useSearchStore,
  type CatalogServiceType,
  type HomeFeedTab,
} from "@stayverse/core";
import { LoadingSpinner, LottieEmptyState, Text, spacing, useTheme } from "@stayverse/ui";
import { DiscoverSectionHeader } from "./DiscoverSectionHeader";
import { HorizontalListingRow } from "./HorizontalListingRow";

function kindFor(tab: HomeFeedTab): CatalogServiceType {
  if (tab === "rides") return "ride";
  if (tab === "chefs") return "chef";
  return "apartment";
}

function emptyCopy(tab: HomeFeedTab) {
  if (tab === "rides") {
    return { kind: "rides" as const, title: "No cars listed yet" };
  }
  if (tab === "chefs") {
    return { kind: "chefs" as const, title: "No chefs listed yet" };
  }
  return { kind: "apartment" as const, title: "No apartments listed yet" };
}

/** Flutter apartment / ride / chef home tab body. */
export function DiscoverFeedTab({ tab }: { tab: HomeFeedTab }) {
  const { colors } = useTheme();
  const kind = kindFor(tab);
  const recommendations = useCatalogRecommendationsQuery(kind);
  const newest = useCatalogNewestQuery(kind);

  const recItems = recommendations.data ?? [];
  const newItems = newest.data ?? [];
  const loading = recommendations.isLoading || newest.isLoading;
  const refreshing =
    (recommendations.isRefetching || newest.isRefetching) && !loading;
  const empty = recItems.length === 0 && newItems.length === 0;
  const copy = emptyCopy(tab);

  const onRefresh = () => {
    void recommendations.refetch();
    void newest.refetch();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {empty ? (
        <View style={styles.centered}>
          <LottieEmptyState kind={copy.kind} title={copy.title} size={110} />
        </View>
      ) : (
        <>
          <DiscoverSectionHeader title="Recommendations" />
          <HorizontalListingRow items={recItems} kind={kind} />
          {tab === "apartments" ? <TopLocations /> : null}
          <DiscoverSectionHeader title="Newly Listed" />
          <HorizontalListingRow items={newItems} kind={kind} />
        </>
      )}
    </ScrollView>
  );
}

const TOP_LOCATIONS = ["Lagos", "Abuja", "Benin", "Delta"] as const;

function TopLocations() {
  const setCity = useSearchStore((s) => s.setCity);
  const setServiceType = useSearchStore((s) => s.setServiceType);

  return (
    <View style={styles.locations}>
      <Text style={styles.locationsTitle}>Top Locations</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.locationRow}
      >
        {TOP_LOCATIONS.map((city) => (
          <Pressable
            key={city}
            style={styles.chip}
            accessibilityRole="button"
            accessibilityLabel={city}
            onPress={() => {
              setServiceType("apartment");
              setCity(city);
              router.push("/search" as Href);
            }}
          >
            <View style={styles.chipDot} />
            <Text style={styles.chipLabel}>{city}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  locations: {
    marginTop: spacing.md,
    gap: 12,
  },
  locationsTitle: {
    paddingHorizontal: spacing.md,
    fontSize: 14,
    fontFamily: "NeueMontreal-Medium",
    color: "#000000",
  },
  locationRow: {
    paddingHorizontal: spacing.md,
    gap: 10,
  },
  chip: {
    height: 26,
    borderRadius: 53,
    backgroundColor: "rgba(251,192,54,0.12)",
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 10,
    paddingLeft: 3,
    gap: 6,
  },
  chipDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FBC036",
  },
  chipLabel: {
    fontSize: 12,
    fontFamily: "NeueMontreal-Medium",
    color: "#000000",
  },
  content: {
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
  },
});
