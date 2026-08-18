import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import {
  useAuthStore,
  useUpdateProfileMutation,
  validateName,
} from "@stayverse/core";
import {
  Button,
  Text,
  TextField,
  showToast,
  spacing,
  useTheme,
} from "@stayverse/ui";

function splitName(full?: string | null): { first: string; last: string } {
  const parts = (full ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0]!, last: "" };
  return { first: parts[0]!, last: parts.slice(1).join(" ") };
}

/** Flutter `EditProfilePage`. */
export default function EditProfileScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const mutation = useUpdateProfileMutation();
  const split = splitName(user?.name);

  const [firstName, setFirstName] = useState(split.first);
  const [lastName, setLastName] = useState(split.last);
  const [touched, setTouched] = useState({ first: false, last: false });

  const errors = useMemo(
    () => ({
      first: touched.first ? validateName(firstName) : null,
      last: touched.last ? validateName(lastName) : null,
    }),
    [firstName, lastName, touched],
  );

  const submit = async () => {
    setTouched({ first: true, last: true });
    const firstErr = validateName(firstName);
    const lastErr = validateName(lastName);
    if (firstErr || lastErr) return;

    try {
      await mutation.mutateAsync({
        firstname: firstName.trim(),
        lastname: lastName.trim(),
      });
      showToast({ type: "success", title: "Profile updated successfully" });
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
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: "Edit Profile" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Edit Profile
        </Text>
        <Text muted style={styles.sub}>
          You can update your profile information.
        </Text>

        <TextField
          label="First Name"
          value={firstName}
          onChangeText={setFirstName}
          onBlur={() => setTouched((t) => ({ ...t, first: true }))}
          error={errors.first ?? undefined}
        />
        <TextField
          label="Last Name"
          value={lastName}
          onChangeText={setLastName}
          onBlur={() => setTouched((t) => ({ ...t, last: true }))}
          error={errors.last ?? undefined}
        />
        <TextField
          label="Phone Number"
          value={user?.phone ?? ""}
          editable={false}
        />
        <TextField label="Email" value={user?.email ?? ""} editable={false} />

        <View style={styles.cta}>
          <Button
            label="Save Changes"
            loading={mutation.isPending}
            onPress={() => void submit()}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginTop: spacing.sm,
  },
  sub: { marginBottom: spacing.sm },
  cta: { marginTop: spacing.lg },
});
