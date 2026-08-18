import { useCallback, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Stack } from "expo-router";
import {
  MediaConstraints,
  pickListingImages,
  pickProfileFromCamera,
  pickProfileFromGallery,
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

/**
 * Phase 11 agent kitchen sink — listing multi-pick + icons + support WebView.
 */
export default function MediaToolsScreen() {
  const { colors } = useTheme();
  const [picked, setPicked] = useState<PickedImage[]>([]);
  const [supportOpen, setSupportOpen] = useState(false);
  const [note, setNote] = useState("");

  const onListing = useCallback(async () => {
    const imgs = await pickListingImages();
    setNote(`Listing: ${imgs.length} (≤${MediaConstraints.listingMaxImages}, ≤5MB)`);
    setPicked(imgs);
  }, []);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: true, title: "Media" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="h3">Media tools</Text>
        <Text variant="bodySmall" muted>
          Agent listing multi-pick 2–12, no compress (Flutter parity)
        </Text>
        {note ? (
          <Text variant="bodySmall" muted>
            {note}
          </Text>
        ) : null}

        <View style={styles.stack}>
          <Button label="Listing gallery" onPress={onListing} />
          <Button
            label="Profile camera"
            variant="outline"
            onPress={async () => {
              const img = await pickProfileFromCamera();
              if (img) setPicked([img]);
            }}
          />
          <Button
            label="Profile gallery"
            variant="secondary"
            onPress={async () => {
              const img = await pickProfileFromGallery();
              if (img) setPicked([img]);
            }}
          />
          <Button
            label="Tawk support"
            variant="outline"
            onPress={() => setSupportOpen(true)}
          />
        </View>

        {picked.length ? (
          <ScrollView horizontal>
            {picked.map((img) => (
              <Image key={img.uri} source={{ uri: img.uri }} style={styles.thumb} />
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.iconRow}>
          {(["home", "wallet", "img_upload", "gallery"] as const).map((name) => (
            <AppIcon key={name} name={name} size={28} color={colors.foreground} />
          ))}
        </View>

        <LottieEmptyState kind="apartment" title="No listings" size={110} />
      </ScrollView>

      <Modal visible={supportOpen} animationType="slide">
        <View style={styles.flex}>
          <Pressable
            onPress={() => setSupportOpen(false)}
            style={[styles.closeBar, { backgroundColor: colors.card }]}
          >
            <Text variant="bodyBold" style={{ color: colors.primary }}>
              Close
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
  thumb: { width: 88, height: 88, borderRadius: 8, marginRight: 8 },
  iconRow: { flexDirection: "row", gap: spacing.md },
  closeBar: { padding: spacing.md, alignItems: "center" },
});
