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
  PlacesAutocompleteField,
  pickListingImages,
  useCreateRideListingMutation,
  type PickedImage,
  type PlaceSuggestion,
} from "@stayverse/core";
import {
  Button,
  Text,
  TextField,
  showToast,
  spacing,
  useTheme,
} from "@stayverse/ui";

const FEATURES = [
  "AC",
  "Bluetooth",
  "GPS",
  "Child Seat",
  "USB Charger",
  "Sunroof",
] as const;

const TYPES = ["Sedan", "SUV", "Truck", "Van", "Luxury"] as const;

/** Flutter ride New Advert — condensed single-screen create. */
export default function CreateRideScreen() {
  const { colors } = useTheme();
  const mutation = useCreateRideListingMutation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [rideType, setRideType] = useState("Sedan");
  const [passengers, setPassengers] = useState("4");
  const [price, setPrice] = useState("");
  const [caution, setCaution] = useState("0");
  const [plate, setPlate] = useState("");
  const [color, setColor] = useState("");
  const [rules, setRules] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [images, setImages] = useState<PickedImage[]>([]);

  const canSubmit = useMemo(() => {
    return (
      name.trim().length > 0 &&
      description.trim().length > 0 &&
      address.trim().length > 0 &&
      Number(price) > 0 &&
      images.length >= 2
    );
  }, [address, description, images.length, name, price]);

  const toggleFeature = (item: string) => {
    setFeatures((prev) =>
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
        rideName: name.trim(),
        rideDescription: description.trim(),
        address: address.trim(),
        placeId,
        rideType,
        features,
        pricePerHour: Number(price) || 0,
        cautionFee: Number(caution) || 0,
        rules: rules.trim() || undefined,
        maxPassengers: Number(passengers) || 1,
        plateNumber: plate.trim() || undefined,
        color: color.trim() || undefined,
        images,
      });
      showToast({ type: "success", title: "Vehicle submitted for review" });
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
      <Stack.Screen options={{ title: "Add Vehicle" }} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text muted>Please fill in this form to make a post</Text>

        <TextField
          label="Vehicle name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Toyota Camry"
        />
        <TextField
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the vehicle"
          multiline
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />

        <PlacesAutocompleteField
          label=""
          value={address}
          onChangeText={(text) => {
            setAddress(text);
            setPlaceId(null);
          }}
          onSelect={(s: PlaceSuggestion) => {
            setAddress(s.description);
            setPlaceId(s.placeId);
          }}
          placeholder="Search address"
        />

        <Text style={[styles.label, { color: colors.foreground }]}>Type</Text>
        <View style={styles.chips}>
          {TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setRideType(t)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    rideType === t ? colors.primary : colors.secondary,
                },
              ]}
            >
              <Text>{t}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.row}>
          <TextField
            label="Max passengers"
            value={passengers}
            onChangeText={setPassengers}
            keyboardType="number-pad"
            containerStyle={styles.half}
          />
          <TextField
            label="Color"
            value={color}
            onChangeText={setColor}
            containerStyle={styles.half}
          />
        </View>

        <View style={styles.row}>
          <TextField
            label="Price / hour"
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
          label="Plate number"
          value={plate}
          onChangeText={setPlate}
          autoCapitalize="characters"
        />
        <TextField
          label="Rules"
          value={rules}
          onChangeText={setRules}
          placeholder="Optional"
          multiline
        />

        <Text style={[styles.label, { color: colors.foreground }]}>Features</Text>
        <View style={styles.chips}>
          {FEATURES.map((a) => {
            const selected = features.includes(a);
            return (
              <Pressable
                key={a}
                onPress={() => toggleFeature(a)}
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
