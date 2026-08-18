import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { palette } from "../theme/tokens";
import { StayverseMark } from "./StayverseMark";

export type StayverseLoaderProps = {
  /** Gold for user app, black for agent app */
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/** Rotating Stayverse "S" loading indicator (Flutter splash/overlay parity). */
export function StayverseLoader({
  color = palette.primary,
  size = 56,
  style,
}: StayverseLoaderProps) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={[styles.wrap, style]}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <StayverseMark size={size} color={color} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
