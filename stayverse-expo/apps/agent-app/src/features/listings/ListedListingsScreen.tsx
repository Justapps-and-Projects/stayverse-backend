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
    <View style={[styles.row, { backgroundColor: colors.card }]}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
      ) : (
        <Image source={shortletPng} style={styles.thumb} />
      )}
      <View style={styles.rowBody}>
        <Text numberOfLines={1} style={{ fontWeight: "600", color: colors.foreground }}>
          {item.title}
        </Text>
        <Text numberOfLines={1} muted>
          {item.subtitle}
        </Text>
        <Text style={{ fontWeight: "600" }}>
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
      <View style={[styles.tabs, { backgroundColor: colors.secondary }]}>
        {TABS.map((tab) => {
          const selected = tab.key === status;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setStatus(tab.key)}
              style={[
                styles.tab,
                selected && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  color: selected ? colors.foreground : colors.muted,
                }}
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
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
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
    margin: spacing.md,
    borderRadius: 25,
    padding: 2,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 25,
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
    borderRadius: 10,
    overflow: "hidden",
    gap: spacing.sm,
  },
  thumb: { width: 90, height: 80 },
  rowBody: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
    gap: 2,
    justifyContent: "center",
  },
});
