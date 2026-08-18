import { useCallback, useMemo, useState } from "react";
import {
  Keyboard,
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
  useForgotPasswordMutation,
  validatePassword,
  validatePin,
} from "@stayverse/core";
import { Button, Text, TextField, showToast, spacing, useTheme } from "@stayverse/ui";

/**
 * Flutter agent `ResetPasswordPage` — confirm field validates as password only
 * (no match check; Flutter parity).
 */
export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = (params.email ?? "").trim();
  const resetMutation = useForgotPasswordMutation();

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({
    otp: false,
    password: false,
    confirm: false,
  });

  const errors = useMemo(
    () => ({
      otp: touched.otp ? validatePin(otp) : null,
      password: touched.password ? validatePassword(password) : null,
      confirm: touched.confirm ? validatePassword(confirm) : null,
    }),
    [touched, otp, password, confirm],
  );

  const submit = useCallback(() => {
    Keyboard.dismiss();
    setTouched({ otp: true, password: true, confirm: true });
    if (validatePin(otp) || validatePassword(password) || validatePassword(confirm)) {
      return;
    }
    if (!email) {
      showToast({ type: "error", title: "Please Try Again" });
      return;
    }

    resetMutation.mutate(
      {
        email,
        otp: otp.trim(),
        password: password.trim(),
      },
      {
        onSuccess: () => {
          showToast({
            type: "success",
            title: "Password reset successfully",
          });
          router.replace("/(auth)/login" as Href);
        },
        onError: (err) => {
          showToast({
            type: "error",
            title: isApiError(err) ? err.message : "Please Try Again",
          });
        },
      },
    );
  }, [email, otp, password, confirm, resetMutation]);

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
          <Text style={[styles.title, { color: colors.text }]}>
            Reset Password
          </Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Enter Your New Password
          </Text>

          <View style={{ height: Math.round(height * 0.05) }} />

          <TextField
            placeholder={`Enter 6 digits Code sent to ${email || "your email"}`}
            value={otp}
            onChangeText={setOtp}
            onBlur={() => setTouched((t) => ({ ...t, otp: true }))}
            keyboardType="number-pad"
            returnKeyType="next"
            error={errors.otp ?? undefined}
          />
          <View style={{ height: 15 }} />
          <TextField
            placeholder="Create Password"
            value={password}
            onChangeText={setPassword}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            secureTextEntry={!showPassword}
            returnKeyType="next"
            error={errors.password ?? undefined}
            suffix={
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                <Text variant="bodySmall" style={{ color: colors.muted }}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </Pressable>
            }
          />
          <View style={{ height: 15 }} />
          <TextField
            placeholder="Confirm Password"
            value={confirm}
            onChangeText={setConfirm}
            onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
            secureTextEntry={!showConfirm}
            returnKeyType="done"
            onSubmitEditing={submit}
            error={errors.confirm ?? undefined}
            suffix={
              <Pressable onPress={() => setShowConfirm((v) => !v)} hitSlop={8}>
                <Text variant="bodySmall" style={{ color: colors.muted }}>
                  {showConfirm ? "Hide" : "Show"}
                </Text>
              </Pressable>
            }
          />

          <View style={{ height: 30 }} />

          <Button
            label="Reset Password"
            variant="dark"
            loading={resetMutation.isPending}
            onPress={submit}
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
});
