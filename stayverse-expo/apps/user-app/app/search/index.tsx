import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { Stack, router, type Href } from "expo-router";
import {
  SearchMapView,
  formatNaira,
  useSearchResultsQuery,
  useSearchStore,
  type ListingSummary,
  type MapMarkerData,
} from "@stayverse/core";
import {
  ChefListingCard,
  ServiceListingCard,
} from "../../src/features/discover/ListingCards";
import {
  LottieEmptyState,
  Text,
  TextField,
  spacing,
  useTheme,
} from "@stayverse/ui";

type TabKey = "list" | "map";

function emptyKindFor(serviceType: "apartment" | "ride" | "chef") {
  if (serviceType === "apartment") return "apartment";
  if (serviceType === "ride") return "rides";
  return "chefs";
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.secondary,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text
        style={{
          color: selected ? colors.foreground : colors.text,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function TabButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tabBtn,
        { borderBottomColor: selected ? colors.primary : "transparent" },
      ]}
    >
      <Text
        style={{
          color: selected ? colors.foreground : colors.muted,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function toMarkers(results: ListingSummary[]): MapMarkerData[] {
  return results
    .filter(
      (item) =>
        item.latitude != null &&
        item.longitude != null &&
        Number.isFinite(item.latitude) &&
        Number.isFinite(item.longitude),
    )
    .map((item) => ({
      id: item.id,
      latitude: item.latitude!,
      longitude: item.longitude!,
      title: item.title,
      subtitle: item.subtitle ?? undefined,
      priceLabel:
        item.price != null ? formatNaira(item.price) : undefined,
    }));
}

export default function SearchScreen() {
  const { colors } = useTheme();

  const serviceType = useSearchStore((s) => s.serviceType);
  const query = useSearchStore((s) => s.filters.query);
  const bedrooms = useSearchStore((s) => s.filters.bedrooms);
  const listingType = useSearchStore((s) => s.filters.listingType);
  const minPrice = useSearchStore((s) => s.filters.minPrice);
  const maxPrice = useSearchStore((s) => s.filters.maxPrice);
  const setQuery = useSearchStore((s) => s.setQuery);
  const setServiceType = useSearchStore((s) => s.setServiceType);
  const setBedrooms = useSearchStore((s) => s.setBedrooms);
  const setListingType = useSearchStore((s) => s.setListingType);
  const setPriceRange = useSearchStore((s) => s.setPriceRange);
  const resetFilters = useSearchStore((s) => s.resetFilters);

  const [tab, setTab] = useState<TabKey>("list");

  const resultsQuery = useSearchResultsQuery(true);
  const results = (resultsQuery.data ?? []) as ListingSummary[];
  const markers = useMemo(() => toMarkers(results), [results]);

  const emptyKind = emptyKindFor(serviceType);

  const typeOptions =
    serviceType === "apartment"
      ? ["Studio", "Apartment", "Duplex", "Penthouse"]
      : serviceType === "ride"
        ? ["Sedan", "SUV", "Truck", "Van", "Luxury"]
        : [];

  const listHeader = useMemo(() => {
    if (serviceType === "apartment") return "Rent";
    if (serviceType === "ride") return "Cars";
    return "Chefs";
  }, [serviceType]);

  const openListing = (id: string) => {
    router.push(`/listing/${serviceType}/${id}` as Href);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: true, title: "Search" }} />

      <View style={styles.topGap} />

      <Text style={[styles.title, { color: colors.foreground }]}>Search</Text>

      <TextField
        placeholder="Search"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        returnKeyType="search"
      />

      <View style={styles.chipsRow}>
        <Chip
          label="Rent"
          selected={serviceType === "apartment"}
          onPress={() => setServiceType("apartment")}
        />
        <Chip
          label="Cars"
          selected={serviceType === "ride"}
          onPress={() => setServiceType("ride")}
        />
        <Chip
          label="Chefs"
          selected={serviceType === "chef"}
          onPress={() => setServiceType("chef")}
        />
      </View>

      <View style={styles.chipsRow}>
        {typeOptions.map((t) => (
          <Chip
            key={t}
            label={t}
            selected={listingType === t}
            onPress={() =>
              setListingType(listingType === t ? null : t)
            }
          />
        ))}
        {serviceType === "apartment"
          ? [1, 2, 3, 4].map((n) => (
              <Chip
                key={`br-${n}`}
                label={`${n}+ bed`}
                selected={bedrooms === n}
                onPress={() => setBedrooms(bedrooms === n ? null : n)}
              />
            ))
          : null}
        <Chip
          label="Under ₦50k"
          selected={maxPrice === 50_000 && minPrice == null}
          onPress={() =>
            maxPrice === 50_000
              ? setPriceRange(null, null)
              : setPriceRange(null, 50_000)
          }
        />
        <Chip
          label="Clear"
          selected={false}
          onPress={() => resetFilters()}
        />
      </View>

      <View style={styles.tabRow}>
        <TabButton
          label="List View"
          selected={tab === "list"}
          onPress={() => setTab("list")}
        />
        <TabButton
          label="Map View"
          selected={tab === "map"}
          onPress={() => setTab("map")}
        />
      </View>

      {tab === "map" ? (
        <View style={styles.mapWrap}>
          {resultsQuery.isLoading ? (
            <View style={styles.mapPlaceholder}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : markers.length === 0 ? (
            <View style={styles.mapPlaceholder}>
              <Text muted style={styles.mapText}>
                No map locations for these results.
              </Text>
            </View>
          ) : (
            <SearchMapView
              markers={markers}
              onSelectMarker={(m) => openListing(m.id)}
            />
          )}
        </View>
      ) : resultsQuery.isLoading ? (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : results.length === 0 ? (
        <LottieEmptyState
          kind={emptyKind as "apartment" | "rides" | "chefs"}
          title="No results found"
          description={`${listHeader} results will appear here.`}
          size={110}
          style={styles.empty}
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const Card =
              serviceType === "chef" ? ChefListingCard : ServiceListingCard;
            return (
              <View style={styles.cardWrap}>
                <Card item={item} />
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.lg, gap: spacing.sm },
  topGap: { height: spacing.sm },
  title: { fontSize: 20, fontWeight: "500" },
  chipsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  tabRow: {
    flexDirection: "row",
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
  },
  mapWrap: { flex: 1, marginHorizontal: -spacing.lg, marginBottom: -spacing.lg },
  mapPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  mapText: { fontSize: 16 },
  empty: { paddingVertical: spacing.lg },
  listContent: { paddingBottom: spacing.xl },
  cardWrap: { marginBottom: spacing.sm },
});
