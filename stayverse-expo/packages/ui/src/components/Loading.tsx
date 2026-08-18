import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { radius } from "../theme/tokens";
import { useThemeColors } from "../theme/ThemeProvider";
import { StayverseLoader } from "./StayverseLoader";

export type LoadingSpinnerProps = {
  size?: "small" | "large";
  color?: string;
  /** Use rotating S mark instead of system spinner */
  branded?: boolean;
};

export function LoadingSpinner({
  size = "large",
  color,
  branded = true,
}: LoadingSpinnerProps) {
  const colors = useThemeColors();
  const markColor = color ?? colors.primary;
  const markSize = size === "small" ? 32 : 56;

  if (branded) {
    return <StayverseLoader color={markColor} size={markSize} />;
  }

  return <ActivityIndicator size={size} color={markColor} />;
}

export type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  style?: StyleProp<ViewStyle>;
  rounded?: boolean;
};

export function Skeleton({ width = "100%", height = 16, style, rounded = true }: SkeletonProps) {
  const colors = useThemeColors();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          opacity,
          backgroundColor: colors.secondary,
          borderRadius: rounded ? radius.md : radius.zero,
        },
        style,
      ]}
    />
  );
}

export function LoadingOverlay({ visible, color }: { visible: boolean; color?: string }) {
  const colors = useThemeColors();
  if (!visible) return null;
  return (
    <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
      <StayverseLoader color={color ?? colors.primary} size={64} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {},
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
});
