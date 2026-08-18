import { useMemo } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { shortletPng } from "@stayverse/assets";
import {
  formatNaira,
  useBookingSelectionStore,
  useUpdateBookingStatusMutation,
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

/** Flutter pending / booked apartment|ride details (condensed). */
export default function AgentBookingDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const selected = useBookingSelectionStore((s) => s.selected);
  const statusMutation = useUpdateBookingStatusMutation();

  const booking: BookingSummary | null = useMemo(() => {
    if (selected && selected.id === id) return selected;
    return null;
  }, [id, selected]);

  const status = booking?.status?.toLowerCase() ?? "";
  const isPending = status === "pending";
  const isBooked = status === "accepted";
  const isCompleted = status === "completed";

  const runStatus = async (
    next: "accepted" | "rejected",
    successTitle: string,
  ) => {
    if (!booking) return;
    try {
      await statusMutation.mutateAsync({
        bookingId: booking.id,
        status: next,
      });
      showToast({ type: "success", title: successTitle });
      router.back();
    } catch (e) {
      showToast({
        type: "error",
        title: e instanceof Error ? e.message : "Please Try Again",
      });
    }
  };

  const onAccept = () => {
    void runStatus("accepted", "Booking accepted successfully");
  };

  const onReject = () => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to decline this booking?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: () =>
            void runStatus("rejected", "Booking cancelled successfully"),
        },
      ],
    );
  };

  if (!booking) {
    return (
      <View style={[styles.wrap, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: "Details" }} />
        <Text muted>Booking not found. Open it from Discover.</Text>
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
      <Text style={[styles.title, { color: colors.foreground }]}>
        {booking.title}
      </Text>
      <Text muted style={{ textTransform: "capitalize" }}>
        {booking.status}
      </Text>

      <View style={[styles.card, { backgroundColor: colors.secondary }]}>
        <Row label="Guest" value={booking.guestName ?? "—"} />
        <Row label="Phone" value={booking.guestPhone ?? "—"} />
        <Row label="Start" value={formatDate(booking.startDate)} />
        <Row label="End" value={formatDate(booking.endDate)} />
        <Row
          label="Total"
          value={
            booking.totalPrice != null ? formatNaira(booking.totalPrice) : "—"
          }
        />
      </View>

      {isPending ? (
        <View style={styles.actions}>
          <Button
            label="Accept Booking"
            onPress={onAccept}
            loading={statusMutation.isPending}
          />
          <Button
            label="Decline"
            variant="dark"
            onPress={onReject}
            disabled={statusMutation.isPending}
          />
        </View>
      ) : null}

      {isBooked && !isCompleted ? (
        <Button
          label="Cancel Booking"
          variant="dark"
          onPress={onReject}
          loading={statusMutation.isPending}
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
      <Text style={{ color: colors.foreground, fontWeight: "500", flexShrink: 1, textAlign: "right" }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.lg, gap: spacing.md },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl },
  hero: { width: "100%", height: 200, borderRadius: 12 },
  title: { fontSize: 20, fontWeight: "600", marginTop: spacing.sm },
  card: {
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  actions: { gap: spacing.sm },
});
