import { useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { shortletPng } from "@stayverse/assets";
import {
  formatNaira,
  useListedApartmentsQuery,
  useListedRidesQuery,
  type ListingOwnerStatus,
  type ListingSummary,
} from "@stayverse/core";
import {
  AppIcon,
  LoadingSpinner,
  LottieEmptyState,
  Text,
  spacing,
  useTheme,
} from "@stayverse/ui";

const TABS: { key: ListingOwnerStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "cancelled", label: "Cancelled" },
];

function ListingRow({ item }: { item: ListingSummary }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
      ) : (
        <Image source={shortletPng} style={styles.thumb} />
      )}
      <View style={styles.rowBody}>
        <Text
          numberOfLines={1}
          style={[styles.title, { color: colors.foreground }]}
        >
          {item.title}
        </Text>
        <View style={styles.locationRow}>
          <AppIcon name="location" size={12} color={colors.muted} />
          <Text
            numberOfLines={1}
            style={[styles.location, { color: colors.muted }]}
          >
            {item.subtitle}
          </Text>
        </View>
        <Text style={[styles.price, { color: colors.foreground }]}>
          {formatNaira(item.price ?? 0)}
          {item.priceSuffix ?? ""}
        </Text>
      </View>
    </View>
  );
}

type Props = {
  kind: "apartment" | "ride";
};

/** Flutter Listed Apartments / Listed Cars. */
export function ListedListingsScreen({ kind }: Props) {
  const { colors } = useTheme();
  const [status, setStatus] = useState<ListingOwnerStatus>("pending");
  const apartments = useListedApartmentsQuery(status);
  const rides = useListedRidesQuery(status);
  const query = kind === "apartment" ? apartments : rides;
  const items = query.data ?? [];

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const selected = tab.key === status;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setStatus(tab.key)}
              style={[
                styles.tab,
                {
                  backgroundColor: selected ? colors.primary : "transparent",
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: selected ? colors.foreground : colors.muted },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {query.isLoading ? (
        <View style={styles.centered}>
          <LoadingSpinner />
        </View>
      ) : (
        <FlatList
          data={items}
          key={status}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            items.length === 0 && styles.fill,
          ]}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => void query.refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <LottieEmptyState
                kind="empty"
                title={
                  kind === "apartment"
                    ? "No apartments found"
                    : "No cars found"
                }
                size={110}
              />
            </View>
          }
          renderItem={({ item }) => <ListingRow item={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  tabs: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 52,
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: "NeueMontreal-Medium",
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  fill: { flexGrow: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },
  row: {
    flexDirection: "row",
    height: 82,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  thumb: { width: 119, height: 82 },
  rowBody: {
    flex: 1,
    paddingHorizontal: 10,
    gap: 2,
    justifyContent: "center",
  },
  title: {
    fontSize: 13,
    fontFamily: "NeueMontreal-Medium",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  location: {
    flex: 1,
    fontSize: 11,
    fontFamily: "NeueMontreal-Regular",
  },
  price: {
    fontSize: 12,
    fontFamily: "NeueMontreal-Medium",
  },
});
