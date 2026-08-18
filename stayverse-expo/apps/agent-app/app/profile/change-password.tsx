import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import {
  useUpdatePasswordMutation,
  validateConfirmPassword,
  validatePassword,
} from "@stayverse/core";
import {
  Button,
  TextField,
  showToast,
  spacing,
  useTheme,
} from "@stayverse/ui";

/** Flutter `ChangePasswordPage`. */
export default function ChangePasswordScreen() {
  const { colors } = useTheme();
  const mutation = useUpdatePasswordMutation();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const errors = useMemo(
    () => ({
      current: touched.current ? validatePassword(current) : null,
      next: touched.next ? validatePassword(next) : null,
      confirm: touched.confirm
        ? validateConfirmPassword(confirm, next)
        : null,
    }),
    [confirm, current, next, touched],
  );

  const submit = async () => {
    setTouched({ current: true, next: true, confirm: true });
    if (
      validatePassword(current) ||
      validatePassword(next) ||
      validateConfirmPassword(confirm, next)
    ) {
      return;
    }

    try {
      await mutation.mutateAsync({
        oldPassword: current,
        newPassword: next,
      });
      showToast({ type: "success", title: "Password updated successfully" });
      router.back();
    } catch (e) {
      showToast({
        type: "error",
        title: e instanceof Error ? e.message : "Please Try Again",
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.wrap, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: "Change Password" }} />
      <View style={styles.form}>
        <TextField
          label="Current Password"
          value={current}
          onChangeText={setCurrent}
          onBlur={() => setTouched((t) => ({ ...t, current: true }))}
          secureTextEntry
          error={errors.current ?? undefined}
        />
        <TextField
          label="New Password"
          value={next}
          onChangeText={setNext}
          onBlur={() => setTouched((t) => ({ ...t, next: true }))}
          secureTextEntry
          error={errors.next ?? undefined}
        />
        <TextField
          label="Confirm Password"
          value={confirm}
          onChangeText={setConfirm}
          onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
          secureTextEntry
          error={errors.confirm ?? undefined}
        />
      </View>
      <View style={styles.cta}>
        <Button
          label="Confirm"
          loading={mutation.isPending}
          onPress={() => void submit()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: spacing.lg,
  },
  form: {
    flex: 1,
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  cta: {
    paddingBottom: spacing.xl,
  },
});
