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
import { Link, Stack, router, useLocalSearchParams, type Href } from "expo-router";
import type { ServiceType } from "@stayverse/core";
import {
  isApiError,
  normalizeNigerianPhone,
  useAuthStore,
  useLoginMutation,
  useRegisterMutation,
  useVerifyTokenMutation,
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
  validatePhoneNumber,
} from "@stayverse/core";
import {
  Button,
  LegalSheetsHost,
  Text,
  TextField,
  showToast,
  spacing,
  useTheme,
} from "@stayverse/ui";

type Touched = {
  firstName: boolean;
  lastName: boolean;
  email: boolean;
  phone: boolean;
  password: boolean;
  confirm: boolean;
};

/**
 * Flutter agent `SignUpPage` — dark CTA, serviceType from SignupAs.
 */
export default function SignupScreen() {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const params = useLocalSearchParams<{ serviceType?: string }>();
  const storeType = useAuthStore((s) => s.serviceType);
  const serviceType =
    (params.serviceType as ServiceType | undefined) ?? storeType ?? "apartment";

  const registerMutation = useRegisterMutation();
  const verifyMutation = useVerifyTokenMutation();
  const loginMutation = useLoginMutation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState<Touched>({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
    password: false,
    confirm: false,
  });

  const busy =
    registerMutation.isPending ||
    verifyMutation.isPending ||
    loginMutation.isPending;

  const errors = useMemo(
    () => ({
      firstName: touched.firstName ? validateName(firstName) : null,
      lastName: touched.lastName ? validateName(lastName) : null,
      email: touched.email ? validateEmail(email) : null,
      phone: touched.phone ? validatePhoneNumber(phone) : null,
      password: touched.password ? validatePassword(password) : null,
      confirm: touched.confirm
        ? validateConfirmPassword(confirm, password)
        : null,
    }),
    [touched, firstName, lastName, email, phone, password, confirm],
  );

  const submit = useCallback(async () => {
    Keyboard.dismiss();
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      password: true,
      confirm: true,
    });
    if (
      validateName(firstName) ||
      validateName(lastName) ||
      validateEmail(email) ||
      validatePhoneNumber(phone) ||
      validatePassword(password) ||
      validateConfirmPassword(confirm, password)
    ) {
      showToast({
        type: "error",
        title: "Please complete all required fields correctly.",
      });
      return;
    }

    const emailTrim = email.trim();
    const passwordTrim = password.trim();

    try {
      const result = await registerMutation.mutateAsync({
        firstname: firstName.trim(),
        lastname: lastName.trim(),
        email: emailTrim,
        phoneNumber: normalizeNigerianPhone(phone.trim()),
        password: passwordTrim,
        serviceType,
      });

      showToast({
        type: "success",
        title: result.emailDelivered
          ? "Account created. Check your email for the verification code."
          : "Account created. Enter the verification code to continue.",
      });

      if (result.otp != null && result.otp.length === 6) {
        try {
          await verifyMutation.mutateAsync({
            email: emailTrim,
            otp: result.otp,
          });
          await loginMutation.mutateAsync({
            email: emailTrim,
            password: passwordTrim,
          });
          router.replace("/(tabs)" as Href);
          return;
        } catch {
          // Fall through
        }
      }

      const q = new URLSearchParams({
        email: emailTrim,
        password: passwordTrim,
      });
      if (result.otp) q.set("initialOtp", result.otp);
      router.push(`/(auth)/verify-otp?${q.toString()}` as Href);
    } catch (err) {
      showToast({
        type: "error",
        title: isApiError(err) ? err.message : "Sign up failed. Please try again.",
      });
    }
  }, [
    firstName,
    lastName,
    email,
    phone,
    password,
    confirm,
    serviceType,
    registerMutation,
    verifyMutation,
    loginMutation,
  ]);

  return (
    <LegalSheetsHost>
      {({ showTerms, showPrivacy }) => (
        <>
          <Stack.Screen options={{ title: "", headerBackTitle: "" }} />
          <KeyboardAvoidingView
            style={[styles.flex, { backgroundColor: colors.background }]}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              contentContainerStyle={[
                styles.content,
                { paddingTop: Math.round(height * 0.02) },
              ]}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={[styles.title, { color: colors.text }]}>Sign Up</Text>
              <Text style={[styles.subtitle, { color: colors.text }]}>
                Please fill in this form to create an account
              </Text>

              <View style={{ height: Math.round(height * 0.05) }} />

              <View style={styles.row}>
                <TextField
                  containerStyle={styles.half}
                  placeholder="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
                  autoCapitalize="words"
                  returnKeyType="next"
                  error={errors.firstName ?? undefined}
                />
                <View style={{ width: 15 }} />
                <TextField
                  containerStyle={styles.half}
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
                  autoCapitalize="words"
                  returnKeyType="next"
                  error={errors.lastName ?? undefined}
                />
              </View>

              <View style={{ height: 15 }} />
              <TextField
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                error={errors.email ?? undefined}
              />
              <View style={{ height: 15 }} />
              <TextField
                placeholder="Phone Number"
                value={phone}
                onChangeText={setPhone}
                onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                keyboardType="number-pad"
                returnKeyType="next"
                error={errors.phone ?? undefined}
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
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={8}
                  >
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
                  <Pressable
                    onPress={() => setShowConfirm((v) => !v)}
                    hitSlop={8}
                  >
                    <Text variant="bodySmall" style={{ color: colors.muted }}>
                      {showConfirm ? "Hide" : "Show"}
                    </Text>
                  </Pressable>
                }
              />

              <View style={{ height: 40 }} />

              <Button
                label="Sign Up"
                variant="dark"
                loading={busy}
                onPress={submit}
              />

              <View style={{ height: 10 }} />

              <Text style={[styles.footer, { color: colors.text }]}>
                Already have an account?{" "}
                <Text
                  style={[styles.footerLink, { color: colors.primary }]}
                  onPress={() => router.push("/(auth)/login" as Href)}
                >
                  Login
                </Text>
              </Text>

              <View style={{ height: 30 }} />

              <Text style={[styles.legal, { color: colors.text }]}>
                By pressing Sign up securely, you agree to our{" "}
                <Text
                  style={[styles.legalLink, { color: colors.primary }]}
                  onPress={showTerms}
                >
                  Terms &{"\n"}Conditions
                </Text>
                {" and "}
                <Text
                  style={[styles.legalLink, { color: colors.primary }]}
                  onPress={showPrivacy}
                >
                  Privacy Policy
                </Text>
                {". Your data will be securely encrypted in transit."}
              </Text>

              <View style={{ height: 30 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </>
      )}
    </LegalSheetsHost>
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
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "NeueMontreal-Regular",
  },
  row: { flexDirection: "row", alignItems: "flex-start" },
  half: { flex: 1 },
  footer: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "NeueMontreal-Medium",
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
    fontFamily: "NeueMontreal-Medium",
  },
  legal: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "NeueMontreal-Medium",
    lineHeight: 18,
  },
  legalLink: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "NeueMontreal-Medium",
  },
});
