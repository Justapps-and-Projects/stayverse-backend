import { useCallback, useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, View } from "react-native";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import {
  StayverseWebView,
  formatNaira,
  useAuthStore,
  useBookingFormStore,
  useFundWalletMutation,
  useProfileQuery,
  useSubmitApartmentBookingMutation,
  useSubmitRideBookingMutation,
  verifyPaymentWithRetry,
} from "@stayverse/core";
import {
  Button,
  Text,
  showToast,
  spacing,
  useTheme,
} from "@stayverse/ui";

/**
 * Flutter apartment/ride Confirm Payment — wallet check → Paystack → POST /booking.
 */
export default function BookPaymentScreen() {
  const { colors } = useTheme();
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const isApartment = kind !== "ride";

  const apartment = useBookingFormStore((s) => s.apartment);
  const ride = useBookingFormStore((s) => s.ride);
  const balance = useAuthStore((s) => s.user?.balance ?? 0);
  const profileQuery = useProfileQuery();

  const fundMutation = useFundWalletMutation();
  const apartmentBook = useSubmitApartmentBookingMutation();
  const rideBook = useSubmitRideBookingMutation();

  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [paystackUrl, setPaystackUrl] = useState<string | null>(null);
  const [pendingReference, setPendingReference] = useState<string | null>(null);

  const draft = isApartment ? apartment : ride;
  const serviceFee = isApartment ? apartment.apartmentFee : ride.rideFee;
  const cautionFee = draft.cautionFee;
  const totalPrice = draft.totalPrice;

  const processBooking = useCallback(async () => {
    setBusyMessage(isApartment ? "Booking Apartment" : "Booking Ride");
    try {
      if (isApartment) {
        if (!apartment.listingId || !apartment.startDate || !apartment.endDate) {
          throw new Error("Missing booking details");
        }
        await apartmentBook.mutateAsync({
          apartmentId: apartment.listingId,
          startDate: apartment.startDate,
          endDate: apartment.endDate,
          totalAmout: apartment.totalPrice,
        });
      } else {
        if (!ride.listingId || !ride.pickupDateTime) {
          throw new Error("Missing booking details");
        }
        await rideBook.mutateAsync({
          rideId: ride.listingId,
          startDate: ride.pickupDateTime,
          pickupPlaceId: ride.pickupPlaceId,
          totalHours: ride.totalHours,
          notes: ride.notes,
          securityDetails: ride.securityDetails,
        });
      }
      showToast({
        type: "success",
        title: "Booking has been sent successfully",
      });
      router.replace(
        `/book/confirmed?kind=${isApartment ? "apartment" : "ride"}` as Href,
      );
    } catch (e) {
      showToast({
        type: "error",
        title: e instanceof Error ? e.message : "Please Try Again",
      });
    } finally {
      setBusyMessage(null);
    }
  }, [apartment, apartmentBook, isApartment, ride, rideBook]);

  const onPaystackClose = useCallback(
    async (_success?: boolean) => {
      const reference = pendingReference;
      setPaystackUrl(null);
      if (!reference) return;
      setBusyMessage("Verifying payment...");
      try {
        await verifyPaymentWithRetry(reference);
        await profileQuery.refetch();
        setPendingReference(null);
        setBusyMessage(null);
        await processBooking();
      } catch (e) {
        setBusyMessage(null);
        showToast({
          type: "error",
          title: e instanceof Error ? e.message : "Payment was not completed",
        });
      }
    },
    [pendingReference, processBooking, profileQuery],
  );

  const submit = async () => {
    if (!draft.listingId || totalPrice <= 0) {
      showToast({ type: "error", title: "Missing booking details" });
      return;
    }

    const currentBalance =
      (await profileQuery.refetch()).data?.balance ?? balance;

    if (currentBalance >= totalPrice) {
      await processBooking();
      return;
    }

    const fundAmount = totalPrice - currentBalance;
    setBusyMessage("Processing payment...");
    try {
      const funded = await fundMutation.mutateAsync(fundAmount);
      setBusyMessage(null);
      setPendingReference(funded.reference);
      setPaystackUrl(funded.authorizationUrl);
    } catch {
      setBusyMessage(null);
      showToast({ type: "error", title: "Please try payment again" });
    }
  };

  if (!draft.listingId) {
    return (
      <View style={[styles.wrap, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: "Confirm Payment" }} />
        <Text muted>No booking draft found</Text>
        <Button label="Go back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "Confirm Payment" }} />

      <View
        style={[
          styles.hero,
          { backgroundColor: `${colors.primary}1A` },
        ]}
      >
        <Text style={{ fontSize: 48 }}>😊</Text>
      </View>

      <Text style={[styles.totalLabel, { color: colors.muted }]}>
        Total Payment
      </Text>
      <Text style={[styles.total, { color: colors.foreground }]}>
        {formatNaira(totalPrice)}
      </Text>

      <View style={[styles.card, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>
          Payment Breakdown
        </Text>
        <Row label="Payment Type" value="Wallet Transfer" />
        <Row
          label={isApartment ? "Apartment Fee" : "Ride Fee"}
          value={formatNaira(serviceFee)}
        />
        <Row label="Caution Fee" value={formatNaira(cautionFee)} />
        <Row label="Total Amount" value={formatNaira(totalPrice)} bold />
      </View>

      <View style={[styles.note, { backgroundColor: colors.secondary }]}>
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "500" }}>
          Note: Caution Fees would be refunded to your wallet 24hrs after
          checking out.
        </Text>
      </View>

      <Button
        label={isApartment ? "Book Apartment" : "Book Ride"}
        onPress={() => void submit()}
        disabled={!!busyMessage}
      />

      <Modal visible={!!busyMessage} transparent animationType="fade">
        <View style={styles.overlay}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={{ color: "#fff", marginTop: spacing.md }}>
            {busyMessage}
          </Text>
        </View>
      </Modal>

      <Modal visible={!!paystackUrl} animationType="slide">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <Stack.Screen options={{ title: "Wallet" }} />
          <View style={styles.paystackHeader}>
            <Text style={{ fontSize: 18, fontWeight: "500" }}>Wallet</Text>
            <Button
              label="Close"
              variant="ghost"
              fullWidth={false}
              onPress={() => void onPaystackClose(false)}
            />
          </View>
          {paystackUrl ? (
            <StayverseWebView
              url={paystackUrl}
              mode="paystack"
              onClose={(ok) => void onPaystackClose(ok)}
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={{ fontWeight: bold ? "600" : "400" }}>{label}</Text>
      <Text style={{ fontWeight: bold ? "600" : "500" }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  hero: {
    height: 120,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
  },
  totalLabel: { textAlign: "center", fontSize: 14 },
  total: {
    textAlign: "center",
    fontSize: 32,
    fontWeight: "700",
  },
  card: {
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: { fontWeight: "600", marginBottom: spacing.xs },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  note: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 5,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  paystackHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
});
