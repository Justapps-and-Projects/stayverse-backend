import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { radius, spacing, typography } from "../theme/tokens";
import { Text } from "../theme/Text";
import { useThemeColors } from "../theme/ThemeProvider";

export type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  helperText?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

export function TextField({
  label,
  error,
  helperText,
  prefix,
  suffix,
  containerStyle,
  style,
  editable = true,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? colors.error
    : focused
      ? colors.borderFocus
      : colors.border;

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? (
        <Text variant="bodySmallBold" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          {
            borderColor,
            backgroundColor: editable ? colors.surface : colors.secondary,
            opacity: editable ? 1 : 0.7,
          },
        ]}
      >
        {prefix ? <View style={styles.affix}>{prefix}</View> : null}
        <TextInput
          placeholderTextColor={colors.muted}
          editable={editable}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            typography.body,
            { color: colors.text },
            style,
          ]}
          {...rest}
        />
        {suffix ? <View style={styles.affix}>{suffix}</View> : null}
      </View>
      {error ? (
        <Text variant="caption" style={{ color: colors.error }}>
          {error}
        </Text>
      ) : helperText ? (
        <Text variant="caption" muted>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
    width: "100%",
  },
  label: {
    marginBottom: 2,
  },
  field: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  affix: {
    justifyContent: "center",
  },
});
