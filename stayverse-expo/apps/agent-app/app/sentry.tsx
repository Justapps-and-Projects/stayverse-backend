import { StyleSheet, View } from "react-native";
import { Stack, Redirect, type Href } from "expo-router";
import {
  addStayverseBreadcrumb,
  captureStayverseException,
  getEnv,
  isSentryAvailable,
  sentryEnvironmentTag,
} from "@stayverse/core";
import { Button, Text, spacing, useTheme } from "@stayverse/ui";

/** Phase 12 agent Sentry kitchen sink. */
export default function SentryToolsScreen() {
  const { colors } = useTheme();
  const env = getEnv();
  const ready = isSentryAvailable();
  if (!__DEV__) return <Redirect href={"/(tabs)" as Href} />;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: true, title: "Sentry" }} />
      <Text variant="h3">Sentry test</Text>
      <Text variant="bodySmall" muted>
        DSN: {env.SENTRY_DSN ? "set" : "missing"} · {sentryEnvironmentTag()} ·
        ready: {ready ? "yes" : "no"}
      </Text>
      <Button
        label="Capture test exception"
        onPress={() => {
          addStayverseBreadcrumb("Agent Sentry test", "ui");
          captureStayverseException(new Error("Stayverse agent Phase 12 Sentry test"), {
            source: "sentry",
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.lg, gap: spacing.md },
});
