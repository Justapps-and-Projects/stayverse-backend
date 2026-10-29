import { ListingAddressField } from "../../src/components/ListingAddressField";
import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import {
  pickListingImages,
  useCreateApartmentListingMutation,
  type PickedImage,
} from "@stayverse/core";
import {
  Button,
  Text,
  TextField,
  showToast,
  spacing,
  useTheme,
} from "@stayverse/ui";

const AMENITIES = [
  "Pool",
  "Balcony",
  "Snooker Board",
  "Garage",
  "Security",
  "Gym",
  "Air Conditioning",
  "Parking",
  "Wifi",
  "Washer",
] as const;

const TYPES = ["Studio", "Apartment", "Duplex", "Penthouse"] as const;

/** Flutter apartment New Advert — condensed single-screen create. */
export default function CreateApartmentScreen() {
  const { colors } = useTheme();
  const mutation = useCreateApartmentListingMutation();

  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [address, setAddress] = useState("");
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [apartmentType, setApartmentType] = useState<string>("Apartment");
  const [bedrooms, setBedrooms] = useState("1");
  const [guests, setGuests] = useState("2");
  const [price, setPrice] = useState("");
  const [caution, setCaution] = useState("0");
  const [rules, setRules] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<PickedImage[]>([]);

  const canSubmit = useMemo(() => {
    return (
      name.trim().length > 0 &&
      details.trim().length > 0 &&
      address.trim().length > 0 &&
      Number(price) > 0 &&
      images.length >= 2
    );
  }, [address, details, images.length, name, price]);

  const toggleAmenity = (item: string) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item],
    );
  };

  const pickImages = async () => {
    const picked = await pickListingImages({ selectionLimit: 12 });
    if (picked.length) setImages((prev) => [...prev, ...picked].slice(0, 12));
  };

  const submit = async () => {
    if (!canSubmit) {
      showToast({
        type: "error",
        title: "Add name, details, address, price, and at least 2 photos",
      });
      return;
    }
    try {
      await mutation.mutateAsync({
        apartmentName: name.trim(),
        details: details.trim(),
        address: address.trim(),
        placeId,
        apartmentType,
        numberOfBedrooms: Number(bedrooms) || 1,
        amenities,
        pricePerDay: Number(price) || 0,
        cautionFee: Number(caution) || 0,
        houseRules: rules.trim() || undefined,
        maxGuests: Number(guests) || 1,
        images,
      });
      showToast({ type: "success", title: "Apartment submitted for review" });
      router.back();
    } catch (e) {
      showToast({
        type: "error",
        title: e instanceof Error ? e.message : "Please Try Again",
      });
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "New Advert" }} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text muted>Please fill in this form to make a post</Text>

        <TextField
          label="Apartment name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Lekki Studio"
        />
        <TextField
          label="Details"
          value={details}
          onChangeText={setDetails}
          placeholder="Describe the space"
          multiline
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />

        <ListingAddressField
          address={address}
          onChange={(text, selectedPlaceId) => {
            setAddress(text);
            setPlaceId(selectedPlaceId);
          }}
        />

        <Text style={[styles.label, { color: colors.foreground }]}>Type</Text>
        <View style={styles.chips}>
          {TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setApartmentType(t)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    apartmentType === t ? colors.primary : colors.secondary,
                },
              ]}
            >
              <Text>{t}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.row}>
          <TextField
            label="Bedrooms"
            value={bedrooms}
            onChangeText={setBedrooms}
            keyboardType="number-pad"
            containerStyle={styles.half}
          />
          <TextField
            label="Max guests"
            value={guests}
            onChangeText={setGuests}
            keyboardType="number-pad"
            containerStyle={styles.half}
          />
        </View>

        <View style={styles.row}>
          <TextField
            label="Price / day"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            prefix={<Text>₦</Text>}
            containerStyle={styles.half}
          />
          <TextField
            label="Caution fee"
            value={caution}
            onChangeText={setCaution}
            keyboardType="decimal-pad"
            prefix={<Text>₦</Text>}
            containerStyle={styles.half}
          />
        </View>

        <TextField
          label="House rules"
          value={rules}
          onChangeText={setRules}
          placeholder="Optional"
          multiline
        />

        <Text style={[styles.label, { color: colors.foreground }]}>Amenities</Text>
        <View style={styles.chips}>
          {AMENITIES.map((a) => {
            const selected = amenities.includes(a);
            return (
              <Pressable
                key={a}
                onPress={() => toggleAmenity(a)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected
                      ? colors.primary
                      : colors.secondary,
                  },
                ]}
              >
                <Text>{a}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.foreground }]}>
          Photos (min 2)
        </Text>
        <View style={styles.imagesRow}>
          {images.map((img) => (
            <Image key={img.uri} source={{ uri: img.uri }} style={styles.thumb} />
          ))}
          <Pressable
            onPress={() => void pickImages()}
            style={[styles.addPhoto, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.muted }}>+ Add</Text>
          </Pressable>
        </View>

        <Button
          label="Submit"
          variant="dark"
          onPress={() => void submit()}
          loading={mutation.isPending}
          disabled={!canSubmit}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  label: { fontSize: 14, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  row: { flexDirection: "row", gap: spacing.sm },
  half: { flex: 1 },
  imagesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  thumb: { width: 72, height: 72, borderRadius: 8 },
  addPhoto: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
