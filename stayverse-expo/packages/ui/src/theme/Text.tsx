import React from "react";
import {
  Text as RNText,
  type TextProps as RNTextProps,
  type TextStyle,
  StyleSheet,
} from "react-native";
import { typography, type TypographyKey } from "./tokens";
import { useThemeColors } from "./ThemeProvider";

export type TextProps = RNTextProps & {
  variant?: TypographyKey;
  color?: string;
  muted?: boolean;
};

export function Text({ variant = "body", color, muted, style, ...rest }: TextProps) {
  const colors = useThemeColors();
  const base = typography[variant] as TextStyle;
  return (
    <RNText
      style={[
        styles.base,
        base,
        { color: color ?? (muted ? colors.muted : colors.text) },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
