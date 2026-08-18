import { useMemo, useState } from "react";
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
  formatNaira,
  useAgentBookingsQuery,
  useAgentOverviewQuery,
  useAuthStore,
  useBookingSelectionStore,
  useProfileQuery,
  type BookingSummary,
  type BookingsFilter,
  type OverviewPeriod,
} from "@stayverse/core";
import {
  AppIcon,
  LoadingSpinner,
  LottieEmptyState,
  Text,
  spacing,
  useTheme,
} from "@stayverse/ui";

const PERIODS: { key: OverviewPeriod; label: string }[] = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

/** Flutter Discover tabs: Pending / Booked / Completed. */
const BOOKING_TABS: { key: BookingsFilter; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Booked" },
  { key: "completed", label: "Completed" },
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function firstName(fullName?: string | null): string {
  if (!fullName?.trim()) return "";
  return fullName.trim().split(/\s+/)[0] ?? "";
}

function MetricCard({
  title,
  value,
  icon,
  highlight,
}: {
  title: string;
  value: string;
  icon: "money" | "calender" | "heart" | "message";
  highlight?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: highlight ? colors.primary : colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.cardTop}>
        <Text
          style={[
            styles.cardTitle,
            { color: highlight ? colors.foreground : colors.muted },
          ]}
        >
          {title}
        </Text>
        <AppIcon name={icon} size={18} color={colors.foreground} />
      </View>
      <Text style={[styles.cardValue, { color: colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

function SegmentTab({
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
        styles.segment,
        { backgroundColor: selected ? colors.primary : "transparent" },
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
    >
      <Text
        style={{
          color: selected ? colors.foreground : colors.muted,
          fontWeight: selected ? "600" : "400",
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function BookingRow({ item }: { item: BookingSummary }) {
  const { colors } = useTheme();
  const setSelected = useBookingSelectionStore((s) => s.setSelected);
  return (
    <Pressable
      onPress={() => {
        setSelected(item);
        router.push(`/booking/${item.id}` as Href);
      }}
      style={[styles.bookingCard, { backgroundColor: colors.card }]}
      accessibilityRole="button"
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.bookingImage} />
      ) : (
        <Image source={shortletPng} style={styles.bookingImage} />
      )}
      <View style={styles.bookingBody}>
        <Text
          numberOfLines={1}
          style={[styles.bookingTitle, { color: colors.foreground }]}
        >
          {item.title}
        </Text>
        <View style={styles.locationRow}>
          <AppIcon name="location" size={14} color={colors.muted} />
          <Text
            numberOfLines={1}
            style={[styles.bookingMeta, { color: colors.muted }]}
          >
            {item.address || "—"}
          </Text>
        </View>
        {item.totalPrice != null ? (
          <Text style={[styles.bookingPrice, { color: colors.foreground }]}>
            {formatNaira(item.totalPrice)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Flutter agent Discover overview (apartment / ride / chef shared labels). */
export function AgentOverviewScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const profileQuery = useProfileQuery();
  const overviewQuery = useAgentOverviewQuery();
  const [period, setPeriod] = useState<OverviewPeriod>("week");
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingTab, setBookingTab] = useState<BookingsFilter>("pending");

  const bookingsQuery = useAgentBookingsQuery(bookingTab);
  const bookings = useMemo(
    () => bookingsQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [bookingsQuery.data],
  );

  const periodLabel =
    PERIODS.find((p) => p.key === period)?.label ?? "This Week";

  const metrics = overviewQuery.data;

  const cards = useMemo(() => {
    const valueFor = (counts?: { week: number; month: number; year: number }) =>
      counts?.[period] ?? 0;
    return [
      {
        title: "Earnings",
        value: formatNaira(valueFor(metrics?.earnings)),
        icon: "money" as const,
        highlight: true,
      },
      {
        title: "Bookings",
        value: String(valueFor(metrics?.bookings)),
        icon: "calender" as const,
      },
      {
        title: "Likes",
        value: String(valueFor(metrics?.favorites)),
        icon: "heart" as const,
      },
      {
        title: "Requests",
        value: String(valueFor(metrics?.request)),
        icon: "message" as const,
      },
    ];
  }, [metrics, period]);

  const refreshing =
    (overviewQuery.isRefetching ||
      profileQuery.isRefetching ||
      bookingsQuery.isRefetching) &&
    !bookingsQuery.isFetchingNextPage;

  const onRefresh = () => {
    void overviewQuery.refetch();
    void profileQuery.refetch();
    void bookingsQuery.refetch();
  };

  const listHeader = (
    <View style={styles.headerBlock}>
      <Text style={[styles.greeting, { color: colors.foreground }]}>
        {greeting()}
      </Text>
      <Text style={[styles.name, { color: colors.primary }]}>
        {firstName(user?.name)} 😊
      </Text>

      <View style={styles.overviewHeader}>
        <Text style={[styles.overviewTitle, { color: colors.foreground }]}>
          Overview
        </Text>
        <View>
          <Pressable
            onPress={() => setMenuOpen((v) => !v)}
            style={[styles.periodBtn, { backgroundColor: colors.foreground }]}
          >
            <Text
              style={{
                color: colors.background,
                fontSize: 10,
                fontWeight: "500",
              }}
            >
              {periodLabel}
            </Text>
            <AppIcon name="arrow_down" size={14} color={colors.background} />
          </Pressable>
          {menuOpen ? (
            <View
              style={[
                styles.menu,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {PERIODS.map((p) => (
                <Pressable
                  key={p.key}
                  onPress={() => {
                    setPeriod(p.key);
                    setMenuOpen(false);
                  }}
                  style={styles.menuItem}
                >
                  <Text>{p.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.grid}>
        {cards.slice(0, 2).map((c) => (
          <MetricCard key={c.title} {...c} />
        ))}
      </View>
      <View style={[styles.grid, { marginTop: 10 }]}>
        {cards.slice(2).map((c) => (
          <MetricCard key={c.title} {...c} />
        ))}
      </View>

      <View
        style={[
          styles.segmentWrap,
          { borderColor: colors.primary, backgroundColor: colors.card },
        ]}
      >
        {BOOKING_TABS.map((tab) => (
          <SegmentTab
            key={tab.key}
            label={tab.label}
            selected={tab.key === bookingTab}
            onPress={() => setBookingTab(tab.key)}
          />
        ))}
      </View>
    </View>
  );

  if (overviewQuery.isLoading && !overviewQuery.data) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        onEndReached={() => {
          if (bookingsQuery.hasNextPage && !bookingsQuery.isFetchingNextPage) {
            void bookingsQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          bookingsQuery.isFetchingNextPage ? (
            <View style={styles.footer}>
              <LoadingSpinner size="small" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          bookingsQuery.isLoading ? (
            <View style={styles.listEmpty}>
              <LoadingSpinner />
            </View>
          ) : (
            <LottieEmptyState
              kind="empty"
              title={`No ${BOOKING_TABS.find((t) => t.key === bookingTab)?.label ?? ""} Bookings`}
              size={100}
            />
          )
        }
        renderItem={({ item }) => <BookingRow item={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  listContent: {
    padding: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  headerBlock: { gap: spacing.sm, marginBottom: spacing.sm },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "500",
  },
  name: {
    fontSize: 24,
    fontWeight: "500",
    marginBottom: spacing.md,
  },
  overviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    zIndex: 2,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: "500",
  },
  periodBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 5,
  },
  menu: {
    position: "absolute",
    top: 42,
    right: 0,
    minWidth: 140,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    zIndex: 10,
    elevation: 4,
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  grid: {
    flexDirection: "row",
    gap: 10,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    minHeight: 90,
    gap: spacing.sm,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  segmentWrap: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 20,
    marginTop: spacing.lg,
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  bookingCard: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  bookingImage: {
    width: 88,
    height: 88,
  },
  bookingBody: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: "center",
    gap: 4,
  },
  bookingTitle: { fontSize: 14, fontWeight: "600" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  bookingMeta: { flex: 1, fontSize: 12 },
  bookingPrice: { fontSize: 13, fontWeight: "600" },
  listEmpty: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: { paddingVertical: spacing.md, alignItems: "center" },
});
