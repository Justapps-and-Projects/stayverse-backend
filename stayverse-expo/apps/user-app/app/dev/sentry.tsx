import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import {
  addStayverseBreadcrumb,
  captureStayverseException,
  getEnv,
  isSentryAvailable,
  sentryEnvironmentTag,
} from "@stayverse/core";
import { Button, Text, spacing, useTheme } from "@stayverse/ui";

/**
 * Phase 12 — manually throw a test error to verify Sentry ingest.
 * Requires EXPO_PUBLIC_SENTRY_DSN + a native/dev-client build.
 */
export default function SentryDevScreen() {
  const { colors } = useTheme();
  const env = getEnv();
  const ready = isSentryAvailable();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: true, title: "Sentry" }} />
      <Text variant="h3">Sentry test</Text>
      <Text variant="bodySmall" muted>
        DSN: {env.SENTRY_DSN ? "set" : "missing"} · env tag:{" "}
        {sentryEnvironmentTag()} · ready: {ready ? "yes" : "no"}
      </Text>
      <Text variant="bodySmall" muted>
        Copy Flutter `SENTRY_DNS` → monorepo `EXPO_PUBLIC_SENTRY_DSN`, then
        rebuild the dev client.
      </Text>

      <Button
        label="Add breadcrumb + throw"
        onPress={() => {
          addStayverseBreadcrumb("Manual Sentry test button", "ui", {
            screen: "dev/sentry",
          });
          captureStayverseException(new Error("Stayverse Phase 12 Sentry test error"), {
            source: "dev/sentry",
          });
        }}
      />

      <Button
        label="Throw unhandled (JS)"
        variant="destructive"
        onPress={() => {
          addStayverseBreadcrumb("About to throw unhandled", "ui");
          throw new Error("Stayverse unhandled Sentry test");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
