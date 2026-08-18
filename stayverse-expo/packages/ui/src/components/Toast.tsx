import React from "react";
import Toast, { type ToastConfig } from "react-native-toast-message";
import { StyleSheet, View } from "react-native";
import { radius, spacing } from "../theme/tokens";
import { Text } from "../theme/Text";
import { useThemeColors } from "../theme/ThemeProvider";
import { lightColors, type ThemeColors } from "../theme/tokens";

function toastConfig(colors: ThemeColors): ToastConfig {
  const base = (bg: string) =>
    ({ text1, text2 }: { text1?: string; text2?: string }) => (
      <View style={[styles.toast, { backgroundColor: bg }]}>
        {text1 ? (
          <Text variant="bodyBold" style={{ color: colors.primaryContent }}>
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text variant="bodySmall" style={{ color: colors.primaryContent }}>
            {text2}
          </Text>
        ) : null}
      </View>
    );

  return {
    success: base(colors.success),
    error: base(colors.error),
    info: base(colors.buttonBg),
  };
}

export function ToastHost() {
  const colors = useThemeColors();
  return <Toast config={toastConfig(colors)} />;
}

export type ShowToastInput = {
  type?: "success" | "error" | "info";
  title: string;
  message?: string;
};

export function showToast({ type = "info", title, message }: ShowToastInput) {
  Toast.show({
    type,
    text1: title,
    text2: message,
    position: "top",
  });
}

/** For use outside ThemeProvider */
export function defaultToastConfig() {
  return toastConfig(lightColors);
}

const styles = StyleSheet.create({
  toast: {
    width: "90%",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
  },
});
