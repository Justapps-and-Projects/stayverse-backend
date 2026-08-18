import React from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { radius, spacing } from "../theme/tokens";
import { Text } from "../theme/Text";
import { useThemeColors } from "../theme/ThemeProvider";

export type BadgeVariant = "default" | "primary" | "success" | "error" | "outline";

export type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function Badge({ label, variant = "default", onPress, style }: BadgeProps) {
  const colors = useThemeColors();
  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "success"
        ? colors.success
        : variant === "error"
          ? colors.error
          : variant === "outline"
            ? "transparent"
            : colors.secondary;
  const fg =
    variant === "primary"
      ? colors.foreground
      : variant === "success" || variant === "error"
        ? colors.primaryContent
        : colors.text;

  const content = (
    <View
      style={[
        styles.base,
        {
          backgroundColor: bg,
          borderColor: variant === "outline" ? colors.border : bg,
        },
        style,
      ]}
    >
      <Text variant="caption" style={{ color: fg, fontStyle: "normal" }}>
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }
  return content;
}

/** Alias matching migration doc naming */
export const Chip = Badge;

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
});
