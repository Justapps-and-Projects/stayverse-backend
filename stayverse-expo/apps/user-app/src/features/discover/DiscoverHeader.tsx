import { StyleSheet, View } from "react-native";
import { useAuthStore } from "@stayverse/core";
import { Text, spacing, useTheme } from "@stayverse/ui";

function firstName(name?: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? "";
}

/** Flutter `HomeHeader` — greeting + explore prompt. */
export function DiscoverHeader() {
  const { colors } = useTheme();
  const name = useAuthStore((s) => firstName(s.user?.name));

  return (
    <View style={styles.wrap}>
      <Text style={[styles.line, { color: colors.foreground }]}>
        Hi{" "}
        <Text style={[styles.line, { color: colors.primary }]}>{name}</Text>
      </Text>
      <Text style={[styles.line, { color: colors.foreground }]}>
        Let&apos;s start exploring! 😊
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  line: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: "NeueMontreal-Medium",
  },
});
