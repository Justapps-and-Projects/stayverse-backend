import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Stack, router, type Href } from "expo-router";
import {
  useAuthStore,
  useDeleteAccountMutation,
  validatePassword,
} from "@stayverse/core";
import {
  Button,
  Text,
  TextField,
  showToast,
  spacing,
  useTheme,
} from "@stayverse/ui";

/** Flutter `DeleteAccountPage`. */
export default function DeleteAccountScreen() {
  const { colors } = useTheme();
  const logout = useAuthStore((s) => s.logout);
  const mutation = useDeleteAccountMutation();

  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);

  const error = useMemo(
    () => (touched ? validatePassword(password) : null),
    [password, touched],
  );

  const submit = async () => {
    setTouched(true);
    if (validatePassword(password)) return;
    try {
      await mutation.mutateAsync(password.trim());
      showToast({ type: "success", title: "Account deleted successfully" });
      logout();
      router.replace("/(auth)/login" as Href);
    } catch (e) {
      showToast({
        type: "error",
        title: e instanceof Error ? e.message : "Please Try Again",
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: "Delete Account" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.copy, { color: colors.foreground }]}>
          You will lose access to your profile, and all account details will be
          permanently erased.
        </Text>
        <TextField
          placeholder="Type in your password to confirm"
          value={password}
          onChangeText={setPassword}
          onBlur={() => setTouched(true)}
          secureTextEntry
          error={error ?? undefined}
        />
        <Button
          label="Delete Account"
          variant="destructive"
          onPress={() => void submit()}
          loading={mutation.isPending}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 30,
    gap: spacing.lg,
  },
  copy: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "400",
  },
});
