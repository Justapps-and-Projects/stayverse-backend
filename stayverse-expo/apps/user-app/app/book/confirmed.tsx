import { useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import {
  DEFAULT_MAP_LOCATION,
  formatNaira,
  useBookingFormStore,
  useNearbyListingsQuery,
  type ListingSummary,
} from "@stayverse/core";
import { Button, Text, spacing, useTheme } from "@stayverse/ui";
import {
  ChefListingCard,
  ServiceListingCard,
} from "../../src/features/discover/ListingCards";

function NearbyRow({
  title,
  items,
  kind,
}: {
  title: string;
  items: ListingSummary[];
  kind: "chef" | "ride";
}) {
  const { colors } = useTheme();
  if (items.length === 0) return null;
  return (
    <View style={styles.addonBlock}>
      <Text style={[styles.addonTitle, { color: colors.foreground }]}>
        {title}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.addonList}
      >
        {items.map((item) =>
          kind === "chef" ? (
            <ChefListingCard key={item.id} item={item} />
          ) : (
            <ServiceListingCard key={item.id} item={item} />
          ),
        )}
      </ScrollView>
    </View>
  );
}

/** Flutter Booking Confirmed success screen + nearby chef/car upsell. */
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

  const stayCoords = useMemo(() => {
    if (
      apartment.latitude != null &&
      apartment.longitude != null &&
      Number.isFinite(apartment.latitude) &&
      Number.isFinite(apartment.longitude)
    ) {
      return { latitude: apartment.latitude, longitude: apartment.longitude };
    }
    return DEFAULT_MAP_LOCATION;
  }, [apartment.latitude, apartment.longitude]);

  const chefsQuery = useNearbyListingsQuery("chef", stayCoords, isApartment);
  const ridesQuery = useNearbyListingsQuery("ride", stayCoords, isApartment);
  const nearbyChefs = chefsQuery.data ?? [];
  const nearbyRides = ridesQuery.data ?? [];
  const addonsLoading =
    isApartment && (chefsQuery.isLoading || ridesQuery.isLoading);
  const hasAddons = nearbyChefs.length > 0 || nearbyRides.length > 0;

  const continueSearch = () => {
    if (isApartment) resetApartment();
    else resetRide();
    router.dismissAll();
    router.replace("/(tabs)" as Href);
  };

  return (
    <ScrollView
      style={[styles.wrap, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
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

      {isApartment ? (
        <View style={styles.addons}>
          <Text style={[styles.addonHeading, { color: colors.foreground }]}>
            Enhance your stay
          </Text>
          <Text muted style={styles.addonSub}>
            Chefs and cars available near this apartment
          </Text>
          {addonsLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
          ) : hasAddons ? (
            <>
              <NearbyRow
                title="Chefs near you"
                items={nearbyChefs}
                kind="chef"
              />
              <NearbyRow
                title="Cars near you"
                items={nearbyRides}
                kind="ride"
              />
            </>
          ) : (
            <Text muted style={styles.addonSub}>
              No nearby chefs or cars are listed for this area yet.
            </Text>
          )}
        </View>
      ) : null}

      <Button label="Continue Search" onPress={continueSearch} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
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
  addons: {
    gap: spacing.xs,
  },
  addonHeading: {
    fontSize: 18,
    fontWeight: "700",
  },
  addonSub: {
    fontSize: 13,
  },
  addonBlock: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  addonTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  addonList: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
