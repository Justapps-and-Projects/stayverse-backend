import { useMemo } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { shortletPng } from "@stayverse/assets";
import {
  formatNaira,
  useBookingSelectionStore,
  useCancelBookingMutation,
  type BookingSummary,
} from "@stayverse/core";
import {
  Button,
  Text,
  showToast,
  spacing,
  useTheme,
} from "@stayverse/ui";

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Flutter apartment/car/chef booked detail (condensed). */
export default function BookingDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const selected = useBookingSelectionStore((s) => s.selected);
  const cancelMutation = useCancelBookingMutation();

  const booking: BookingSummary | null = useMemo(() => {
    if (selected && selected.id === id) return selected;
    return selected;
  }, [id, selected]);

  const isCompleted = booking?.status?.toLowerCase() === "completed";
  const canCancel =
    !!booking &&
    !isCompleted &&
    booking.status?.toLowerCase() !== "rejected";

  const onCancel = () => {
    if (!booking) return;
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await cancelMutation.mutateAsync(booking.id);
                showToast({ type: "success", title: "Booking cancelled" });
                router.back();
              } catch (e) {
                showToast({
                  type: "error",
                  title: e instanceof Error ? e.message : "Please Try Again",
                });
              }
            })();
          },
        },
      ],
    );
  };

  const onLeaveReview = () => {
    if (!booking) return;
    router.push(
      `/booking/review?serviceType=${booking.serviceType}&serviceId=${booking.listingId}` as Href,
    );
  };

  if (!booking || booking.id !== id) {
    return (
      <View style={[styles.wrap, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: "Details" }} />
        <Text muted>Booking not found. Open it from your bookings list.</Text>
        <Button label="Go back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen options={{ title: "Details" }} />
      {booking.imageUrl ? (
        <Image source={{ uri: booking.imageUrl }} style={styles.hero} />
      ) : (
        <Image source={shortletPng} style={styles.hero} />
      )}
      <View
        style={[styles.status, { backgroundColor: `${colors.primary}33` }]}
      >
        <Text style={{ fontWeight: "600", textTransform: "capitalize" }}>
          {booking.status || "Pending"}
        </Text>
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>
        {booking.title}
      </Text>
      <Text muted>{booking.address || "—"}</Text>
      {booking.description ? (
        <Text style={{ color: colors.muted, marginTop: spacing.sm }}>
          {booking.description}
        </Text>
      ) : null}

      <View style={[styles.card, { backgroundColor: colors.secondary }]}>
        <Row label="Start" value={formatDate(booking.startDate)} />
        <Row label="End" value={formatDate(booking.endDate)} />
        <Row
          label="Total"
          value={
            booking.totalPrice != null ? formatNaira(booking.totalPrice) : "—"
          }
        />
      </View>

      {isCompleted ? (
        <Button label="Leave a Review" variant="dark" onPress={onLeaveReview} />
      ) : canCancel ? (
        <Button
          label="Cancel Booking"
          variant="dark"
          onPress={onCancel}
          loading={cancelMutation.isPending}
        />
      ) : null}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={{ color: colors.muted }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontWeight: "500" }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.lg, gap: spacing.md },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl },
  hero: { width: "100%", height: 200, borderRadius: 12 },
  status: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  title: { fontSize: 20, fontWeight: "600", marginTop: spacing.sm },
  card: { borderRadius: 12, padding: spacing.md, gap: spacing.sm, marginVertical: spacing.md },
  row: { flexDirection: "row", justifyContent: "space-between" },
});
