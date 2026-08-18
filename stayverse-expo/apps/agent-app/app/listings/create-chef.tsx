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
  useCreateChefProfileMutation,
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

const SPECIALTIES = [
  "Nigerian",
  "Continental",
  "Pastry",
  "Grill",
  "Seafood",
  "Vegan",
  "BBQ",
  "Asian",
] as const;

/** Flutter chef setup — condensed single-screen create. */
export default function CreateChefScreen() {
  const { colors } = useTheme();
  const mutation = useCreateChefProfileMutation();

  const [bio, setBio] = useState("");
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState("");
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [cover, setCover] = useState<PickedImage | null>(null);
  const [profile, setProfile] = useState<PickedImage | null>(null);

  const canSubmit = useMemo(
    () => bio.trim().length > 10 && Number(price) > 0,
    [bio, price],
  );

  const toggle = (item: string) => {
    setSpecialties((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item],
    );
  };

  const submit = async () => {
    if (!canSubmit) {
      showToast({ type: "error", title: "Add bio and hourly price" });
      return;
    }
    try {
      await mutation.mutateAsync({
        bio: bio.trim(),
        culinarySpecialties: specialties,
        pricingPerHour: Number(price) || 0,
        address: address.trim() || undefined,
        placeId,
        coverPhoto: cover,
        profilePicture: profile,
      });
      showToast({ type: "success", title: "Chef profile submitted" });
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
      <Stack.Screen options={{ title: "Chef Profile" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text muted>Set up your chef profile</Text>
        <TextField
          label="Bio"
          value={bio}
          onChangeText={setBio}
          multiline
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />
        <TextField
          label="Price / hour"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
          prefix={<Text>₦</Text>}
        />
        <PlacesAutocompleteField
          label="Address"
          value={address}
          onChangeText={(t) => {
            setAddress(t);
            setPlaceId(null);
          }}
          onSelect={(s: PlaceSuggestion) => {
            setAddress(s.description);
            setPlaceId(s.placeId);
          }}
        />
        <Text style={[styles.label, { color: colors.foreground }]}>
          Specialties
        </Text>
        <View style={styles.chips}>
          {SPECIALTIES.map((s) => {
            const selected = specialties.includes(s);
            return (
              <Pressable
                key={s}
                onPress={() => toggle(s)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected
                      ? colors.primary
                      : colors.secondary,
                  },
                ]}
              >
                <Text>{s}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.label, { color: colors.foreground }]}>Photos</Text>
        <View style={styles.imagesRow}>
          <Pressable
            onPress={async () => {
              const imgs = await pickListingImages({ selectionLimit: 1 });
              if (imgs[0]) setProfile(imgs[0]);
            }}
            style={[styles.addPhoto, { borderColor: colors.border }]}
          >
            {profile ? (
              <Image source={{ uri: profile.uri }} style={styles.thumb} />
            ) : (
              <Text muted>Profile</Text>
            )}
          </Pressable>
          <Pressable
            onPress={async () => {
              const imgs = await pickListingImages({ selectionLimit: 1 });
              if (imgs[0]) setCover(imgs[0]);
            }}
            style={[styles.addPhoto, { borderColor: colors.border }]}
          >
            {cover ? (
              <Image source={{ uri: cover.uri }} style={styles.thumb} />
            ) : (
              <Text muted>Cover</Text>
            )}
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
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  label: { fontSize: 14, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  imagesRow: { flexDirection: "row", gap: 8 },
  addPhoto: {
    width: 88,
    height: 88,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumb: { width: "100%", height: "100%" },
});
