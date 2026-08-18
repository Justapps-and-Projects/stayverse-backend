import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import {
  SelfieCamera,
  useVerifyKycMutation,
  validateNin,
  type PickedImage,
} from "@stayverse/core";
import {
  AppIcon,
  Button,
  Text,
  TextField,
  showToast,
  spacing,
  useTheme,
} from "@stayverse/ui";

/** Flutter `KycVerificationPage`. */
export default function KycScreen() {
  const { colors } = useTheme();
  const mutation = useVerifyKycMutation();

  const [nin, setNin] = useState("");
  const [ninTouched, setNinTouched] = useState(false);
  const [selfie, setSelfie] = useState<PickedImage | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const ninError = ninTouched ? validateNin(nin) : null;

  const submit = useCallback(async () => {
    setNinTouched(true);
    const err = validateNin(nin);
    if (err) return;
    if (!selfie) {
      showToast({
        type: "error",
        title: "Selfie Required",
        message: "Take selfie",
      });
      return;
    }
    try {
      await mutation.mutateAsync({ nin: nin.trim(), selfie });
      showToast({ type: "success", title: "KYC verified successfully" });
      router.back();
    } catch (e) {
      showToast({
        type: "error",
        title: e instanceof Error ? e.message : "Please Try Again",
      });
    }
  }, [mutation, nin, selfie]);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "KYC Verification" }} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.heading, { color: colors.foreground }]}>
          Complete your identity verification
        </Text>
        <Text style={[styles.sub, { color: colors.muted }]}>
          We need to verify your identity to ensure the security of your account
          and comply with regulatory requirements.
        </Text>

        <Text style={[styles.label, { color: colors.foreground }]}>
          National Identification Number (NIN)
        </Text>
        <TextField
          placeholder="Enter your 11-digit NIN"
          value={nin}
          onChangeText={(v) => setNin(v.replace(/\D/g, "").slice(0, 11))}
          onBlur={() => setNinTouched(true)}
          keyboardType="number-pad"
          maxLength={11}
          error={ninError ?? undefined}
        />

        <Text style={[styles.label, { color: colors.foreground }]}>
          Selfie Verification
        </Text>
        <Text style={[styles.hint, { color: colors.muted }]}>
          Take a clear selfie for identity verification
        </Text>

        <Pressable
          onPress={() => setCameraOpen(true)}
          style={[
            styles.selfieBox,
            { backgroundColor: colors.secondary, borderColor: colors.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Take selfie"
        >
          {selfie ? (
            <Image source={{ uri: selfie.uri }} style={styles.selfieImage} />
          ) : (
            <View style={styles.selfieEmpty}>
              <AppIcon name="verify_biometrics" size={48} color={colors.muted} />
              <Text style={{ color: colors.muted }}>Tap to take selfie</Text>
            </View>
          )}
        </Pressable>

        {selfie ? (
          <View style={styles.selfieMeta}>
            <Text style={{ color: "#22C55E", fontWeight: "500" }}>
              ✓ Selfie captured successfully
            </Text>
            <Pressable onPress={() => setCameraOpen(true)}>
              <Text style={{ color: colors.primary, fontWeight: "500" }}>
                Retake
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.spacer} />
        <Button
          label="Submit Verification"
          onPress={() => void submit()}
          loading={mutation.isPending}
        />
      </ScrollView>

      <Modal visible={cameraOpen} animationType="slide">
        <SelfieCamera
          onCapture={(image) => {
            setSelfie(image);
            setCameraOpen(false);
          }}
          onCancel={() => setCameraOpen(false)}
        />
      </Modal>

      <Modal visible={mutation.isPending} transparent animationType="fade">
        <View style={styles.busy}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  heading: { fontSize: 16, fontWeight: "600", marginTop: 10 },
  sub: { fontSize: 12, marginBottom: spacing.md },
  label: { fontSize: 14, fontWeight: "500", marginTop: spacing.md },
  hint: { fontSize: 12, marginBottom: spacing.sm },
  selfieBox: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  selfieEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  selfieImage: { width: "100%", height: "100%" },
  selfieMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  spacer: { flexGrow: 1, minHeight: 40 },
  busy: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
});
