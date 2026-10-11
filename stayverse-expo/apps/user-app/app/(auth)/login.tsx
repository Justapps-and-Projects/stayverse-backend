import { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, type Href } from "expo-router";
import {
  DevTestUserCredentials,
  forceDevLogin,
  getEnv,
  isApiError,
  isSocialSignInCancelled,
  promptAppleIdToken,
  promptGoogleIdToken,
  useLoginMutation,
  useSocialLoginMutation,
  validateEmail,
  validatePassword,
} from "@stayverse/core";
import {
  Button,
  SocialSignInButtons,
  Text,
  TextField,
  showToast,
  spacing,
  useTheme,
} from "@stayverse/ui";

/**
 * Flutter `LoginPage` — user app.
 * Uses shared Button (same as onboarding Next/Get Started) + TextField.
 * Secondary actions are underlined gold text links (Flutter parity).
 */
export default function LoginScreen() {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const loginMutation = useLoginMutation();
  const socialLogin = useSocialLoginMutation();
  const isDev = getEnv().APP_ENV === "development" && __DEV__;

  const [email, setEmail] = useState(
    isDev ? DevTestUserCredentials.email : "",
  );
  const [password, setPassword] = useState(
    isDev ? DevTestUserCredentials.password : "",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  const emailError = useMemo(
    () => (touched.email ? validateEmail(email) : null),
    [email, touched.email],
  );
  const passwordError = useMemo(
    () => (touched.password ? validatePassword(password) : null),
    [password, touched.password],
  );

  const submit = useCallback(() => {
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setTouched({ email: true, password: true });
    if (eErr || pErr) {
      showToast({
        type: "error",
        title: "Please enter a valid email and password.",
      });
      return;
    }

    loginMutation.mutate(
      { email: email.trim(), password: password.trim() },
      {
        onSuccess: () => {
          router.replace("/(tabs)" as Href);
        },
        onError: (err) => {
          if (isApiError(err) && err.code === "EMAIL_NOT_VERIFIED") {
            showToast({
              type: "success",
              title: "Please verify your email",
            });
            router.push(
              `/(auth)/verify-otp?email=${encodeURIComponent(email.trim())}&password=${encodeURIComponent(password.trim())}` as Href,
            );
            return;
          }
          showToast({
            type: "error",
            title: isApiError(err) ? err.message : "Login failed. Please try again.",
          });
        },
      },
    );
  }, [email, password, loginMutation]);

  const signInWith = useCallback(
    async (provider: "google" | "apple") => {
      if (socialLogin.isPending || loginMutation.isPending) return;
      try {
        const credential =
          provider === "google"
            ? await promptGoogleIdToken()
            : await promptAppleIdToken();
        await socialLogin.mutateAsync({
          provider,
          idToken: credential.idToken,
          firstname: credential.firstname,
          lastname: credential.lastname,
        });
        router.replace("/(tabs)" as Href);
      } catch (err) {
        if (isSocialSignInCancelled(err)) return;
        showToast({
          type: "error",
          title: isApiError(err)
            ? err.status === 404
              ? "Google and Apple sign-in need a server update. Try again after the API is deployed."
              : err.message
            : err instanceof Error
              ? err.message
              : "Sign-in failed. Please try again.",
        });
      }
    },
    [loginMutation.isPending, socialLogin],
  );

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
          <Text style={[styles.title, { color: colors.text }]}>Sign In</Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Please fill this form with your login credentials
          </Text>

          <View style={{ height: Math.round(height * 0.05) }} />

          <TextField
            placeholder="Email Address or Phone Number"
            value={email}
            onChangeText={setEmail}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            returnKeyType="next"
            error={emailError ?? undefined}
          />
          <View style={{ height: 15 }} />
          <TextField
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            secureTextEntry={!showPassword}
            textContentType="password"
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={submit}
            error={passwordError ?? undefined}
            suffix={
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={colors.muted}
                />
              </Pressable>
            }
          />

          <View style={{ height: 20 }} />

          {isDev ? (
            <Text style={styles.devBanner}>
              Dev: demo user credentials (auto-login)
            </Text>
          ) : null}

          <Pressable
            onPress={() => router.push("/(auth)/forgot-password" as Href)}
            hitSlop={8}
            accessibilityRole="link"
          >
            <Text style={[styles.link, { color: colors.primary }]}>
              Forgot Password
            </Text>
          </Pressable>

          <View style={{ height: Math.round(height * 0.05) }} />

          <Button
            label="Login"
            variant="primary"
            loading={loginMutation.isPending}
            onPress={submit}
          />

          <View style={{ height: 30 }} />

          <View style={styles.orRow}>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <Text style={styles.orText}>Or</Text>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
          </View>

          <View style={{ height: 25 }} />

          <SocialSignInButtons
            onGooglePress={() => void signInWith("google")}
            onApplePress={() => void signInWith("apple")}
          />

          <View style={{ height: 28 }} />

          <Text style={[styles.footer, { color: colors.text }]}>
            Don&apos;t have an account?{" "}
            <Text
              style={[styles.linkInline, { color: colors.primary }]}
              onPress={() => router.push("/(auth)/signup" as Href)}
            >
              Signup
            </Text>
          </Text>

          {isDev ? (
            <>
              <View style={{ height: 16 }} />
              <Button
                label="Continue as signed-in (dev)"
                variant="outline"
                onPress={() => {
                  forceDevLogin({
                    email: email || DevTestUserCredentials.email,
                    role: "user",
                  });
                  router.replace("/(tabs)" as Href);
                }}
              />
            </>
          ) : null}

          <View style={{ height: 20 }} />
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
  // Bold family file — do NOT also set fontWeight (causes RN font fallback)
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
  link: {
    fontSize: 12,
    fontFamily: "NeueMontreal-Medium",
    color: "#FBC036",
  },
  linkInline: {
    fontSize: 12,
    fontFamily: "NeueMontreal-Medium",
    color: "#FBC036",
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 30,
    gap: 8,
  },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  orText: {
    fontSize: 15,
    color: "#9E9E9E",
    fontFamily: "NeueMontreal-Medium",
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "NeueMontreal-Medium",
  },
  devBanner: {
    fontSize: 12,
    color: "#9A3412",
    marginBottom: 8,
    fontFamily: "NeueMontreal-Medium",
  },
});
