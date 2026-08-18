import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { palette, spacing } from "../theme/tokens";
import { useThemeColors } from "../theme/ThemeProvider";

export type LinkButtonVariant = "primary" | "dark" | "outline";

export type LinkButtonProps = Omit<PressableProps, "children" | "style"> & {
  label: string;
  /** User = yellow accent, agent = black accent */
  variant?: LinkButtonVariant;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Secondary CTA styled as a proper pill button (replaces bare text links).
 */
export function LinkButton({
  label,
  variant = "primary",
  fullWidth = true,
  disabled,
  style,
  ...rest
}: LinkButtonProps) {
  const colors = useThemeColors();

  const accent =
    variant === "dark" ? palette.text : variant === "outline" ? colors.primary : palette.primary;

  const bg =
    variant === "outline"
      ? "transparent"
      : variant === "dark"
        ? `${palette.text}12`
        : `${palette.primary}22`;

  const borderColor = variant === "outline" ? accent : "transparent";
  const textColor = variant === "dark" ? palette.text : accent;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderColor,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        style,
      ]}
      {...rest}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 9999,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
    textAlign: "center",
  },
});
