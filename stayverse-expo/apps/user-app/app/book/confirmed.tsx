import { StyleSheet, View } from "react-native";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import {
  formatNaira,
  useBookingFormStore,
} from "@stayverse/core";
import { Button, Text, spacing, useTheme } from "@stayverse/ui";

/** Flutter Booking Confirmed success screen. */
export default function BookingConfirmedScreen() {
  const { colors } = useTheme();
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const isApartment = kind !== "ride";
  const apartment = useBookingFormStore((s) => s.apartment);
  const ride = useBookingFormStore((s) => s.ride);
  const resetApartment = useBookingFormStore((s) => s.resetApartment);
  const resetRide = useBookingFormStore((s) => s.resetRide);

  const title = isApartment ? apartment.title : ride.title;
  const total = isApartment ? apartment.totalPrice : ride.totalPrice;

  const continueSearch = () => {
    if (isApartment) resetApartment();
    else resetRide();
    router.dismissAll();
    router.replace("/(tabs)" as Href);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "Booking Confirmed", headerBackVisible: false }} />

      <View style={[styles.hero, { backgroundColor: `${colors.primary}1A` }]}>
        <Text style={{ fontSize: 48 }}>😊</Text>
      </View>

      <Text style={[styles.heading, { color: colors.foreground }]}>
        Booking Confirmed
      </Text>
      <Text muted style={styles.sub}>
        {title}
      </Text>
      <Text style={[styles.total, { color: colors.foreground }]}>
        {formatNaira(total)}
      </Text>

      {isApartment && apartment.startDate && apartment.endDate ? (
        <View style={[styles.card, { backgroundColor: colors.secondary }]}>
          <Text>Check-in: {new Date(apartment.startDate).toLocaleString()}</Text>
          <Text>Check-out: {new Date(apartment.endDate).toLocaleString()}</Text>
          {apartment.address ? <Text muted>{apartment.address}</Text> : null}
        </View>
      ) : null}

      {!isApartment && ride.pickupDateTime ? (
        <View style={[styles.card, { backgroundColor: colors.secondary }]}>
          <Text>Pick-up: {new Date(ride.pickupDateTime).toLocaleString()}</Text>
          <Text>{ride.totalHours} hours</Text>
          <Text muted>{ride.pickupAddress}</Text>
        </View>
      ) : null}

      <Button label="Continue Search" onPress={continueSearch} />
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
  heading: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
    marginTop: spacing.lg,
  },
  sub: { textAlign: "center" },
  total: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "700",
  },
  card: {
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.xs,
  },
});
