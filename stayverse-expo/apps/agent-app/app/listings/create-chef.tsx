import { useState } from "react";
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
  geocodeAddress,
  pickListingImages,
  prepareImageForUpload,
  useAuthStore,
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
  const accountName = useAuthStore((s) => s.user?.name ?? "");

  const [fullName, setFullName] = useState(accountName);
  const [bio, setBio] = useState("");
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState("");
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [cover, setCover] = useState<PickedImage | null>(null);
  const [profile, setProfile] = useState<PickedImage | null>(null);

  const toggle = (item: string) => {
    setSpecialties((prev) => {
      if (prev.includes(item)) return prev.filter((a) => a !== item);
      if (prev.length >= 5) {
        showToast({ type: "error", title: "Choose up to 5 specialties" });
        return prev;
      }
      return [...prev, item];
    });
  };

  const submit = async () => {
    const name = fullName.trim();
    if (name.length < 2) {
      showToast({ type: "error", title: "Enter your full name" });
      return;
    }
    if (bio.trim().length < 10) {
      showToast({ type: "error", title: "Add a bio of at least 10 characters" });
      return;
    }
    if (!(Number(price) > 0)) {
      showToast({ type: "error", title: "Add an hourly price" });
      return;
    }
    if (specialties.length < 3) {
      showToast({ type: "error", title: "Choose at least 3 specialties" });
      return;
    }
    if (!profile || !cover) {
      showToast({ type: "error", title: "Add a profile photo and a cover photo" });
      return;
    }

    let resolvedPlaceId = placeId;
    let resolvedAddress = address.trim();
    if (!resolvedPlaceId && resolvedAddress) {
      const geo = await geocodeAddress(resolvedAddress);
      resolvedPlaceId = geo?.placeId ?? null;
      if (geo?.formattedAddress) resolvedAddress = geo.formattedAddress;
    }
    if (!resolvedPlaceId) {
      showToast({
        type: "error",
        title: "Choose an address from the suggestions",
      });
      return;
    }

    try {
      const [profilePhoto, coverPhoto] = await Promise.all([
        prepareImageForUpload(profile.uri),
        prepareImageForUpload(cover.uri),
      ]);
      await mutation.mutateAsync({
        fullName: name,
        bio: bio.trim(),
        about: bio.trim(),
        culinarySpecialties: specialties,
        pricingPerHour: Number(price) || 0,
        address: resolvedAddress || undefined,
        placeId: resolvedPlaceId,
        coverPhoto,
        profilePicture: profilePhoto,
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
          label="Full name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your name as guests should see it"
        />
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
