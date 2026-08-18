import { useMemo } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { router, type Href } from "expo-router";
import { shortletPng } from "@stayverse/assets";
import {
  useBookingSelectionStore,
  useBookingsQuery,
  useBookingsUiStore,
  type BookingSummary,
  type BookingsFilter,
} from "@stayverse/core";
import {
  AppIcon,
  LoadingSpinner,
  LottieEmptyState,
  Text,
  spacing,
  useTheme,
} from "@stayverse/ui";

const TABS: { key: BookingsFilter; label: string }[] = [
  { key: "accepted", label: "Accepted" },
  { key: "completed", label: "Completed" },
  { key: "pending", label: "Pending" },
  { key: "rejected", label: "Rejected" },
];

function emptyCopy(filter: BookingsFilter) {
  const subtitle = "No bookings available at the moment,";
  if (filter === "accepted") {
    return { title: "No Accepted Bookings", subtitle };
  }
  if (filter === "completed") {
    return { title: "No Completed Bookings", subtitle };
  }
  if (filter === "pending") {
    return { title: "No Pending Bookings", subtitle };
  }
  return { title: "No Active Bookings", subtitle };
}

function SegmentTab({
  label,
  selected,
  isFirst,
  isLast,
  onPress,
}: {
  label: string;
  selected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  const radius = selected
    ? isFirst
      ? { borderTopLeftRadius: 18, borderBottomLeftRadius: 18 }
      : isLast
        ? { borderTopRightRadius: 18, borderBottomRightRadius: 18 }
        : { borderRadius: 20 }
    : undefined;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.segment,
        radius,
        { backgroundColor: selected ? colors.primary : "transparent" },
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.segmentLabel,
          {
            color: selected ? colors.foreground : colors.muted,
            fontWeight: selected ? "600" : "400",
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function BookingsCard({ item }: { item: BookingSummary }) {
  const { colors } = useTheme();
  const setSelected = useBookingSelectionStore((s) => s.setSelected);

  return (
    <Pressable
      onPress={() => {
        setSelected(item);
        router.push(`/booking/${item.id}` as Href);
      }}
      style={[styles.card, { backgroundColor: colors.card }]}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      ) : (
        <Image source={shortletPng} style={styles.cardImage} />
      )}
      <View style={styles.cardBody}>
        <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.foreground }]}>
          {item.title}
        </Text>
        <View style={styles.locationRow}>
          <AppIcon name="location" size={14} color={colors.muted} />
          <Text numberOfLines={1} style={[styles.cardMeta, { color: colors.muted }]}>
            {item.address}
          </Text>
        </View>
        <Text numberOfLines={1} style={[styles.cardDesc, { color: colors.muted }]}>
          {item.description}
        </Text>
      </View>
    </Pressable>
  );
}

/** Flutter `BookingsPage` — Accepted / Completed / Pending / Rejected. */
export function BookingsScreen() {
  const { colors } = useTheme();

  const filter = useBookingsUiStore((s) => s.filter);
  const setFilter = useBookingsUiStore((s) => s.setFilter);

  const query = useBookingsQuery(filter);
  const items = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const empty = emptyCopy(filter);
  const refreshing = query.isRefetching && !query.isFetchingNextPage;

  const listHeader = (
    <View
      style={[
        styles.segmentWrap,
        { borderColor: colors.primary, backgroundColor: colors.card },
      ]}
    >
      {TABS.map((tab, index) => (
        <SegmentTab
          key={tab.key}
          label={tab.label}
          selected={tab.key === filter}
          isFirst={index === 0}
          isLast={index === TABS.length - 1}
          onPress={() => setFilter(tab.key)}
        />
      ))}
    </View>
  );

  if (query.isLoading) {
    return (
      <View style={[styles.wrap, { backgroundColor: colors.background }]}>
        <View style={styles.headerPad}>{listHeader}</View>
        <View style={styles.centered}>
          <LoadingSpinner />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        key={filter}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<View style={styles.headerPad}>{listHeader}</View>}
        contentContainerStyle={[
          styles.listPad,
          items.length === 0 && styles.fill,
        ]}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void query.refetch()}
            tintColor={colors.primary}
          />
        }
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            void query.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <View style={styles.footer}>
              <LoadingSpinner size="small" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <LottieEmptyState
              kind="empty"
              title={empty.title}
              description={empty.subtitle}
              size={110}
            />
          </View>
        }
        renderItem={({ item }) => <BookingsCard item={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  headerPad: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  listPad: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  fill: { flexGrow: 1 },
  segmentWrap: {
    flexDirection: "row",
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 2,
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentLabel: {
    fontSize: 11,
  },
  card: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  cardImage: {
    width: 130,
    height: 100,
  },
  cardBody: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
    gap: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardMeta: {
    fontSize: 12,
    flex: 1,
  },
  cardDesc: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 280,
  },
  footer: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
});
