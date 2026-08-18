import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { fontFamily, palette, spacing } from "../theme/tokens";
import { useThemeColors } from "../theme/ThemeProvider";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "dark";

export type ButtonProps = Omit<PressableProps, "children"> & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Flutter `AppBtn` parity:
 * - primary → yellow (#FBC036) + black label (user CTAs)
 * - dark → soft black (#2C2C2C) + white label (agent CTAs)
 * - pill shape (stadium ~32px / full), no border on filled variants
 *
 * Styles are applied to an inner View (not only Pressable) so the filled
 * pill always paints — Pressable-only style callbacks can fail to show a
 * background in some NativeWind / New Arch edge cases.
 */
export function Button({
  label,
  variant = "primary",
  loading = false,
  disabled,
  fullWidth = true,
  style,
  ...rest
}: ButtonProps) {
  const colors = useThemeColors();
  const isDisabled = disabled || loading;

  const bg =
    variant === "primary"
      ? palette.primary
      : variant === "secondary"
        ? colors.buttonBg
        : variant === "destructive"
          ? colors.destructive
          : variant === "dark"
            ? palette.text
            : "transparent";

  const textColor =
    variant === "primary"
      ? palette.black
      : variant === "dark"
        ? palette.white
        : variant === "outline" || variant === "ghost"
          ? colors.text
          : colors.primaryContent;

  const showBorder = variant === "outline";
  const borderColor = showBorder ? colors.border : "transparent";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        fullWidth ? styles.fullWidth : styles.autoWidth,
        { opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
      {...rest}
    >
      <View
        style={[
          styles.pill,
          {
            backgroundColor: bg,
            borderColor,
            borderWidth: showBorder ? 1 : 0,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <RNText
            style={[styles.label, { color: textColor }]}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {label}
          </RNText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    alignSelf: "stretch",
    width: "100%",
  },
  autoWidth: {
    alignSelf: "flex-start",
  },
  pill: {
    minHeight: 56,
    borderRadius: 32,
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  label: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
    letterSpacing: 0.2,
    textAlign: "center",
    fontFamily: fontFamily.medium,
  },
});
