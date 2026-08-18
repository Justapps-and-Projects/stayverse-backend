import { useCallback, useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Stack, router, type Href } from "expo-router";
import {
  isApiError,
  useRequestForgotPasswordMutation,
  validateEmail,
} from "@stayverse/core";
import { Button, Text, TextField, showToast, spacing, useTheme } from "@stayverse/ui";

/**
 * Flutter agent `ForgotPasswordPage`.
 */
export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const requestMutation = useRequestForgotPasswordMutation();

  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  const emailError = useMemo(
    () => (touched ? validateEmail(email) : null),
    [email, touched],
  );

  const submit = useCallback(() => {
    Keyboard.dismiss();
    setTouched(true);
    if (validateEmail(email)) return;

    const trimmed = email.trim();
    requestMutation.mutate(trimmed, {
      onSuccess: () => {
        showToast({ type: "success", title: "Email sent successfully" });
        router.replace(
          `/(auth)/reset-password?email=${encodeURIComponent(trimmed)}` as Href,
        );
      },
      onError: (err) => {
        showToast({
          type: "error",
          title: isApiError(err) ? err.message : "Please Try Again",
        });
      },
    });
  }, [email, requestMutation]);

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
            Forgot Password
          </Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Input your registered Email address
          </Text>

          <View style={{ height: Math.round(height * 0.05) }} />

          <TextField
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            onBlur={() => setTouched(true)}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="done"
            onSubmitEditing={submit}
            error={emailError ?? undefined}
          />

          <View style={{ height: 30 }} />

          <Button
            label="Send Code"
            variant="dark"
            loading={requestMutation.isPending}
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
