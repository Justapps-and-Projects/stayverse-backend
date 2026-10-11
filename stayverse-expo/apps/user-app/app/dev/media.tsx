import { useCallback, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Stack, Redirect, type Href } from "expo-router";
import {
  MediaConstraints,
  pickListingImages,
  pickProfileFromCamera,
  pickProfileFromGallery,
  SelfieCamera,
  StayverseWebView,
  TAWK_SUPPORT_URL,
  type PickedImage,
} from "@stayverse/core";
import {
  AppIcon,
  Button,
  LottieEmptyState,
  Text,
  spacing,
  useTheme,
} from "@stayverse/ui";

const SAMPLE_ICONS = [
  "home",
  "favourite",
  "bookings",
  "inbox",
  "profile",
  "gallery",
  "location",
  "wallet",
] as const;

/**
 * Phase 11 kitchen sink — picker, selfie, Lottie, SVG icons, Tawk WebView.
 */
export default function MediaDevScreen() {
  const { colors } = useTheme();
  const [picked, setPicked] = useState<PickedImage[]>([]);
  const [selfieOpen, setSelfieOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [note, setNote] = useState("");

  const onProfileCamera = useCallback(async () => {
    const img = await pickProfileFromCamera();
    setNote(img ? `Camera: ${img.fileName ?? img.uri}` : "Camera cancelled / denied");
    if (img) setPicked([img]);
  }, []);

  const onProfileGallery = useCallback(async () => {
    const img = await pickProfileFromGallery();
    setNote(img ? `Gallery: ${img.fileName ?? img.uri}` : "Gallery cancelled / denied");
    if (img) setPicked([img]);
  }, []);

  const onListing = useCallback(async () => {
    const imgs = await pickListingImages();
    setNote(`Listing pick: ${imgs.length} (min ${MediaConstraints.listingMinImages})`);
    setPicked(imgs);
  }, []);

  if (!__DEV__) return <Redirect href={"/(tabs)" as Href} />;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: true, title: "Media" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="h3">Media & misc UI</Text>
        <Text variant="bodySmall" muted>
          Profile q={MediaConstraints.profileImageQuality} · upload JPEG{" "}
          {MediaConstraints.uploadJpegQuality} / min {MediaConstraints.uploadMinEdge}px
        </Text>
        {note ? (
          <Text variant="bodySmall" muted>
            {note}
          </Text>
        ) : null}

        <View style={styles.stack}>
          <Button label="Profile camera" onPress={onProfileCamera} />
          <Button label="Profile gallery" variant="outline" onPress={onProfileGallery} />
          <Button label="Listing multi-pick" variant="secondary" onPress={onListing} />
          <Button label="KYC selfie" onPress={() => setSelfieOpen(true)} />
          <Button
            label="Tawk support WebView"
            variant="outline"
            onPress={() => setSupportOpen(true)}
          />
        </View>

        {picked.length ? (
          <ScrollView horizontal style={styles.thumbs}>
            {picked.map((img) => (
              <Image key={img.uri} source={{ uri: img.uri }} style={styles.thumb} />
            ))}
          </ScrollView>
        ) : null}

        <Text variant="h4" style={styles.section}>
          AppIcon
        </Text>
        <View style={styles.iconRow}>
          {SAMPLE_ICONS.map((name) => (
            <View key={name} style={styles.iconCell}>
              <AppIcon name={name} size={28} color={colors.foreground} />
              <Text variant="caption" muted>
                {name}
              </Text>
            </View>
          ))}
        </View>

        <Text variant="h4" style={styles.section}>
          Lottie empty
        </Text>
        <LottieEmptyState
          kind="empty"
          title="Nothing here"
          description="Flutter EmptyStateView"
          size={110}
        />
      </ScrollView>

      <Modal visible={selfieOpen} animationType="slide">
        <SelfieCamera
          onCapture={(img) => {
            setPicked([img]);
            setNote(`Selfie: ${img.fileName ?? img.uri}`);
            setSelfieOpen(false);
          }}
          onCancel={() => setSelfieOpen(false)}
        />
      </Modal>

      <Modal visible={supportOpen} animationType="slide">
        <View style={styles.flex}>
          <Pressable
            onPress={() => setSupportOpen(false)}
            style={[styles.closeBar, { backgroundColor: colors.card }]}
          >
            <Text variant="bodyBold" style={{ color: colors.primary }}>
              Close support
            </Text>
          </Pressable>
          <StayverseWebView
            url={TAWK_SUPPORT_URL}
            mode="support"
            onClose={() => setSupportOpen(false)}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  stack: { gap: spacing.sm },
  thumbs: { maxHeight: 96 },
  thumb: { width: 88, height: 88, borderRadius: 8, marginRight: 8 },
  section: { marginTop: spacing.md },
  iconRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  iconCell: { width: 64, alignItems: "center", gap: 4 },
  closeBar: {
    padding: spacing.md,
    alignItems: "center",
  },
});
