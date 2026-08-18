import type { ComponentProps } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import LottieView from "lottie-react-native";
import { Text } from "../theme/Text";
import { spacing } from "../theme/tokens";
import { useThemeColors } from "../theme/ThemeProvider";

export type LottieEmptyKind = "empty" | "apartment" | "chefs" | "rides";

const sources = {
  empty: require("@stayverse/assets/lottie/empty.json"),
  apartment: require("@stayverse/assets/lottie/apartment-empty.json"),
  chefs: require("@stayverse/assets/lottie/chefs-empty.json"),
  rides: require("@stayverse/assets/lottie/rides-empty.json"),
} as const satisfies Record<LottieEmptyKind, object>;

type Props = {
  kind?: LottieEmptyKind;
  title?: string;
  description?: string;
  /** Flutter EmptyStateView default 120; FlexibleEmptyStateView 110 */
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/** Flutter `EmptyStateView` / `FlexibleEmptyStateView` with Lottie. */
export function LottieEmptyState({
  kind = "empty",
  title,
  description,
  size = 120,
  style,
}: Props) {
  const colors = useThemeColors();
  return (
    <View style={[styles.wrap, style]}>
      <LottieView
        source={sources[kind] as ComponentProps<typeof LottieView>["source"]}
        autoPlay
        loop
        style={{ width: size, height: size }}
      />
      {title ? (
        <Text variant="h3" style={[styles.title, { color: colors.foreground }]}>
          {title}
        </Text>
      ) : null}
      {description ? (
        <Text variant="body" muted style={styles.desc}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { textAlign: "center" },
  desc: { textAlign: "center" },
});
