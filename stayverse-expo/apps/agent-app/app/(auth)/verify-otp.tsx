import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import {
  isApiError,
  useLoginMutation,
  useSendTokenMutation,
  useVerifyTokenMutation,
  validatePin,
} from "@stayverse/core";
import {
  Button,
  OtpPinField,
  Text,
  showToast,
  spacing,
  useTheme,
} from "@stayverse/ui";

const COOLDOWN_SECONDS = 60;

function formatMmSs(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Flutter agent `VerifyCodePage` — same flow; resend always emails toast.
 */
export default function VerifyOtpScreen() {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const params = useLocalSearchParams<{
    email?: string;
    password?: string;
    initialOtp?: string;
  }>();
  const email = (params.email ?? "").trim();
  const password = (params.password ?? "").trim();

  const verifyMutation = useVerifyTokenMutation();
  const sendMutation = useSendTokenMutation();
  const loginMutation = useLoginMutation();

  const [otp, setOtp] = useState("");
  const [touched, setTouched] = useState(false);
  const [remaining, setRemaining] = useState(COOLDOWN_SECONDS);
  const autoSubmitted = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const busy =
    verifyMutation.isPending ||
    sendMutation.isPending ||
    loginMutation.isPending;

  const pinError = touched ? validatePin(otp) : null;
  const coolingDown = remaining > 0;

  const startCooldown = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRemaining(COOLDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startCooldown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startCooldown]);

  const submit = useCallback(
    async (code?: string) => {
      const pin = (code ?? otp).trim();
      setTouched(true);
      if (validatePin(pin)) return;
      if (!email) {
        showToast({ type: "error", title: "Please Try Again" });
        return;
      }

      try {
        await verifyMutation.mutateAsync({ email, otp: pin });
        if (password) {
          await loginMutation.mutateAsync({ email, password });
          router.replace("/(tabs)" as Href);
        } else {
          router.replace("/(auth)/login" as Href);
        }
      } catch (err) {
        showToast({
          type: "error",
          title: isApiError(err) ? err.message : "Please Try Again",
        });
      }
    },
    [otp, email, password, verifyMutation, loginMutation],
  );

  useEffect(() => {
    const initial = params.initialOtp ?? "";
    if (autoSubmitted.current) return;
    if (initial.length === 6) {
      autoSubmitted.current = true;
      setOtp(initial);
      const t = setTimeout(() => {
        void submit(initial);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [params.initialOtp, submit]);

  const resend = useCallback(async () => {
    if (!email || coolingDown || sendMutation.isPending) return;
    try {
      await sendMutation.mutateAsync(email);
      showToast({
        type: "success",
        title: "Verification code sent to your email.",
      });
      startCooldown();
    } catch (err) {
      showToast({
        type: "error",
        title: isApiError(err) ? err.message : "Please Try Again",
      });
    }
  }, [email, coolingDown, sendMutation, startCooldown]);

  return (
    <>
      <Stack.Screen options={{ title: "", headerBackTitle: "" }} />
      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: Math.round(height * 0.04) },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: colors.text }]}>6-Digit Code</Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Please enter the code sent to {email}
          </Text>

          <View style={{ height: Math.round(height * 0.05) }} />

          <OtpPinField
            value={otp}
            onChange={setOtp}
            error={pinError ?? undefined}
          />

          <View style={{ height: 20 }} />

          {coolingDown ? (
            <Text style={styles.cooldown}>{formatMmSs(remaining)}</Text>
          ) : (
            <Pressable onPress={resend} disabled={busy} hitSlop={8}>
              <Text style={[styles.resend, { color: colors.primary }]}>
                Resend email
              </Text>
            </Pressable>
          )}

          <View style={{ height: Math.round(height * 0.06) }} />

          <Button
            label="Verify"
            variant="dark"
            loading={busy}
            onPress={() => void submit()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: "NeueMontreal-Bold",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "NeueMontreal-Regular",
  },
  resend: {
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
    fontFamily: "NeueMontreal-Medium",
  },
  cooldown: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(0,0,0,0.8)",
    fontFamily: "NeueMontreal-Medium",
  },
});
