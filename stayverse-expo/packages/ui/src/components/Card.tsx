import React from "react";
import { View, StyleSheet, type ViewProps, type StyleProp, type ViewStyle } from "react-native";
import { radius, shadows, spacing } from "../theme/tokens";
import { useThemeColors } from "../theme/ThemeProvider";

export type CardProps = ViewProps & {
  elevated?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Card({ elevated = true, padded = true, style, children, ...rest }: CardProps) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        styles.base,
        padded && styles.padded,
        elevated && shadows.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  padded: {
    padding: spacing.md,
  },
});
