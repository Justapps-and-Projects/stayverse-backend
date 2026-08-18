import React from "react";
import { Image, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from "react-native";
import { radius } from "../theme/tokens";
import { Text } from "../theme/Text";
import { useThemeColors } from "../theme/ThemeProvider";

export type AvatarProps = {
  size?: number;
  source?: ImageSourcePropType;
  name?: string;
  style?: StyleProp<ViewStyle>;
};

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ size = 40, source, name, style }: AvatarProps) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius.full,
          backgroundColor: colors.primary,
        },
        style,
      ]}
    >
      {source ? (
        <Image source={source} style={{ width: size, height: size, borderRadius: radius.full }} />
      ) : (
        <Text variant="bodySmallBold" style={{ color: colors.foreground }}>
          {initials(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
