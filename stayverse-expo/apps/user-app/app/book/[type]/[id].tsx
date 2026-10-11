import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { shortletPng } from "@stayverse/assets";
import {
  formatNaira,
  useBookingFormStore,
  useListingDetailsQuery,
  useUnavailableDatesQuery,
  PlacesAutocompleteField,
  type CatalogServiceType,
} from "@stayverse/core";
import {
  Button,
  DatePickerField,
  LoadingSpinner,
  Text,
  TextField,
  showToast,
  spacing,
  useTheme,
} from "@stayverse/ui";

function parseKind(type: string | undefined): CatalogServiceType | null {
  if (type === "apartment" || type === "ride") return type;
  return null;
}

function nightsBetween(start: string, end: string): number {
  const a = new Date(`${start}T00:00:00`);
  const b = new Date(`${end}T00:00:00`);
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

function formatShort(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function rangeOverlapsBlocked(
  start: string,
  end: string,
  blocked: string[],
): boolean {
  if (!blocked.length) return false;
  const a = new Date(`${start}T00:00:00`).getTime();
  const b = new Date(`${end}T00:00:00`).getTime();
  return blocked.some((day) => {
    const t = new Date(`${day.slice(0, 10)}T00:00:00`).getTime();
    return t >= a && t < b;
  });
}

const SECURITY_OPTIONS = ["Bodyguards", "Police"] as const;

/** Flutter apartment / ride booking form (`Bookings` app bar). */
export default function BookListingScreen() {
  const { colors } = useTheme();
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>();
  const kind = parseKind(type);
  const query = useListingDetailsQuery(kind ?? undefined, id);
  const unavailable = useUnavailableDatesQuery(kind ?? undefined, id);
  const setApartmentDraft = useBookingFormStore((s) => s.setApartmentDraft);
  const setRideDraft = useBookingFormStore((s) => s.setRideDraft);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupPlaceId, setPickupPlaceId] = useState<string | null>(null);
  const [pickupDateTime, setPickupDateTime] = useState("");
  const [totalHours, setTotalHours] = useState("1");
  const [notes, setNotes] = useState("");
  const [security, setSecurity] = useState<string[]>([]);

  const listing = query.data;
  const blocked = unavailable.data ?? [];

  const apartmentPreview = useMemo(() => {
    if (!listing || listing.kind !== "apartment") return null;
    const nights = nightsBetween(startDate, endDate);
    const apartmentFee = nights * (listing.price ?? 0);
    const cautionFee = listing.cautionFee ?? 0;
    return { nights, apartmentFee, cautionFee, total: apartmentFee + cautionFee };
  }, [listing, startDate, endDate]);

  const ridePreview = useMemo(() => {
    if (!listing || listing.kind !== "ride") return null;
    const hours = Math.max(0, Number(totalHours) || 0);
    const rideFee = hours * (listing.price ?? 0);
    const cautionFee = listing.cautionFee ?? 0;
    return { hours, rideFee, cautionFee, total: rideFee + cautionFee };
  }, [listing, totalHours]);

  if (!kind) {
    return (
      <View style={[styles.wrap, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: "Bookings" }} />
        <Text muted>
          Chefs are hired by chat. Open the chef profile and tap Hire this chef
          to start a conversation.
        </Text>
        <Button
          label="Back to listing"
          onPress={() => {
            if (id) router.replace(`/listing/chef/${id}` as Href);
            else router.back();
          }}
        />
      </View>
    );
  }

  if (query.isLoading || !listing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: "Bookings" }} />
        <LoadingSpinner />
      </View>
    );
  }

  const hero = listing.images[0] ?? listing.imageUrl;

  const confirmApartment = () => {
    if (!startDate || !endDate) {
      showToast({ type: "error", title: "Please select a booking date" });
      return;
    }
    const nights = nightsBetween(startDate, endDate);
    if (nights < 1) {
      showToast({ type: "error", title: "Please select a booking date" });
      return;
    }
    if (rangeOverlapsBlocked(startDate, endDate, blocked)) {
      showToast({ type: "error", title: "Selected dates are unavailable" });
      return;
    }
    const apartmentFee = nights * (listing.price ?? 0);
    const cautionFee = listing.cautionFee ?? 0;
    setApartmentDraft({
      listingId: listing.id,
      title: listing.title,
      address: listing.address,
      latitude: listing.latitude ?? null,
      longitude: listing.longitude ?? null,
      startDate: new Date(`${startDate}T00:00:00`).toISOString(),
      endDate: new Date(`${endDate}T00:00:00`).toISOString(),
      nights,
      pricePerDay: listing.price ?? 0,
      apartmentFee,
      cautionFee,
      totalPrice: apartmentFee + cautionFee,
    });
    router.push("/book/payment?kind=apartment" as Href);
  };

  const confirmRide = () => {
    if (!pickupAddress.trim()) {
      showToast({ type: "error", title: "Please enter pick-up location" });
      return;
    }
    if (!pickupDateTime.trim()) {
      showToast({ type: "error", title: "Please select pick-up date & time" });
      return;
    }
    const hours = Number(totalHours);
    if (!hours || hours < 1) {
      showToast({ type: "error", title: "Total hours must be at least 1" });
      return;
    }
    const rideFee = hours * (listing.price ?? 0);
    const cautionFee = listing.cautionFee ?? 0;
    const dt = new Date(pickupDateTime);
    if (Number.isNaN(dt.getTime())) {
      showToast({
        type: "error",
        title: "Use format YYYY-MM-DDTHH:mm",
      });
      return;
    }
    setRideDraft({
      listingId: listing.id,
      title: listing.title,
      pickupAddress: pickupAddress.trim(),
      pickupPlaceId: pickupPlaceId ?? pickupAddress.trim(),
      pickupDateTime: dt.toISOString(),
      totalHours: hours,
      securityDetails: security,
      notes: notes.trim(),
      pricePerHour: listing.price ?? 0,
      rideFee,
      cautionFee,
      totalPrice: rideFee + cautionFee,
    });
    router.push("/book/payment?kind=ride" as Href);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen options={{ title: "Bookings" }} />

      {hero ? (
        <Image source={{ uri: hero }} style={styles.hero} />
      ) : (
        <Image source={shortletPng} style={styles.hero} />
      )}

      <Text style={[styles.title, { color: colors.foreground }]}>
        {listing.title}
      </Text>
      <Text style={[styles.price, { color: colors.foreground }]}>
        {formatNaira(listing.price ?? 0)}
        <Text style={{ color: colors.muted }}>
          {kind === "apartment" ? "/day" : "/hr"}
        </Text>
      </Text>

      {kind === "apartment" ? (
        <View style={styles.form}>
          <View style={styles.rowBetween}>
            <Text>Stay Duration</Text>
            <Text style={{ fontWeight: "500" }}>
              {formatShort(startDate || null)} - {formatShort(endDate || null)}
            </Text>
          </View>
          <View style={styles.rowBetween}>
            <Text>Apartment Price</Text>
            <Text style={{ fontWeight: "500" }}>
              {formatNaira(apartmentPreview?.apartmentFee ?? 0)}
            </Text>
          </View>
          <DatePickerField
            label="Check-in"
            value={startDate}
            onChange={setStartDate}
            minimumDate={new Date()}
            placeholder="Select check-in date"
          />
          <DatePickerField
            label="Check-out"
            value={endDate}
            onChange={setEndDate}
            minimumDate={
              startDate
                ? new Date(`${startDate}T12:00:00`)
                : new Date()
            }
            placeholder="Select check-out date"
          />
          {blocked.length > 0 ? (
            <Text muted style={styles.hint}>
              Some dates are unavailable ({blocked.length} blocked)
            </Text>
          ) : null}
          <Button label="Confirm Bookings" onPress={confirmApartment} />
        </View>
      ) : (
        <View style={styles.form}>
          <PlacesAutocompleteField
            label="Pick-Up Location"
            placeholder="Enter pick-up address"
            value={pickupAddress}
            onChangeText={(text) => {
              setPickupAddress(text);
              setPickupPlaceId(null);
            }}
            onSelect={(place) => {
              setPickupAddress(place.description);
              setPickupPlaceId(place.placeId);
            }}
          />
          <DatePickerField
            label="Pick-Up Date & Time"
            value={pickupDateTime}
            onChange={setPickupDateTime}
            mode="datetime"
            minimumDate={new Date()}
            placeholder="Select pick-up date & time"
          />
          <TextField
            label="Total hours"
            value={totalHours}
            onChangeText={setTotalHours}
            keyboardType="number-pad"
          />
          <Text style={{ color: colors.foreground, fontWeight: "500" }}>
            Security Details
          </Text>
          <View style={styles.chips}>
            {SECURITY_OPTIONS.map((opt) => {
              const selected = security.includes(opt);
              return (
                <Pressable
                  key={opt}
                  onPress={() =>
                    setSecurity((prev) =>
                      selected
                        ? prev.filter((x) => x !== opt)
                        : [...prev, opt],
                    )
                  }
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected
                        ? colors.primary
                        : colors.secondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text>{opt}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextField
            label="Additional Request"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
          <View style={styles.rowBetween}>
            <Text>Estimated total</Text>
            <Text style={{ fontWeight: "600" }}>
              {formatNaira(ridePreview?.total ?? 0)}
            </Text>
          </View>
          <Button label="Confirm Bookings" onPress={confirmRide} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.lg, gap: spacing.md },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  hero: { width: "100%", height: 200, borderRadius: 12 },
  title: { fontSize: 18, fontWeight: "700" },
  price: { fontSize: 20, fontWeight: "600" },
  form: { gap: spacing.md },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hint: { fontSize: 12 },
  chips: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
});
