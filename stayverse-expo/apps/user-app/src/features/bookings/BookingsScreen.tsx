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
  { key: "accepted", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "rejected", label: "Rejected" },
];

function emptyCopy(filter: BookingsFilter) {
  const subtitle = "No bookings available at the moment,";
  if (filter === "accepted") {
    return { title: "No Active Bookings", subtitle };
  }
  if (filter === "completed") {
    return { title: "No Completed Bookings", subtitle };
  }
  if (filter === "pending") {
    return { title: "No Pending Bookings", subtitle };
  }
  return { title: "No Active Bookings", subtitle };
}

function formatStayDate(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function stayLine(item: BookingSummary): string {
  const start = formatStayDate(item.startDate);
  const end = formatStayDate(item.endDate);
  if (start && end && start !== end) return `${start} - ${end}`;
  if (start) return `Check-in ${start}`;
  return end ? `Check-out ${end}` : "";
}

function PillTab({
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
        styles.pill,
        {
          backgroundColor: selected ? colors.primary : "transparent",
          borderColor: colors.primary,
        },
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
    >
      <Text
        numberOfLines={1}
        style={[styles.pillLabel, { color: colors.foreground }]}
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
          <AppIcon name="location" size={12} color={colors.muted} />
          <Text numberOfLines={1} style={[styles.cardMeta, { color: colors.muted }]}>
            {item.address}
          </Text>
        </View>
        {stayLine(item) ? (
          <Text numberOfLines={1} style={styles.cardDate}>
            {stayLine(item)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Bookings list — Active and Completed. */
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
    <View style={styles.pillRow}>
      {TABS.map((tab) => (
        <PillTab
          key={tab.key}
          label={tab.label}
          selected={tab.key === filter}
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
  pillRow: {
    flexDirection: "row",
    gap: 12,
  },
  pill: {
    flex: 1,
    height: 36,
    borderRadius: 52,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  pillLabel: {
    fontSize: 11,
    fontFamily: "NeueMontreal-Medium",
  },
  card: {
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
  cardImage: {
    width: 119,
    height: 82,
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: "center",
    gap: 2,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: "NeueMontreal-Medium",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardMeta: {
    fontSize: 11,
    fontFamily: "NeueMontreal-Regular",
    flex: 1,
  },
  cardDate: {
    fontSize: 11,
    fontFamily: "NeueMontreal-Regular",
    color: "#D1D1D6",
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
