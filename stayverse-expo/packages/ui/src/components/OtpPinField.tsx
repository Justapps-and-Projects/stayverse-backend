import React, { useRef } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputKeyPressEvent,
} from "react-native";
import { Text } from "../theme/Text";
import { useThemeColors } from "../theme/ThemeProvider";

export type OtpPinFieldProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: string;
  obscure?: boolean;
  autoFocus?: boolean;
  onComplete?: (value: string) => void;
};

/**
 * Flutter `PinCodeTextField` underline style — 6 cells, optional `*` obscure.
 */
export function OtpPinField({
  value,
  onChange,
  length = 6,
  error,
  obscure = true,
  autoFocus = true,
  onComplete,
}: OtpPinFieldProps) {
  const colors = useThemeColors();
  const inputs = useRef<(TextInput | null)[]>([]);

  const setDigits = (next: string) => {
    const joined = next.replace(/\D/g, "").slice(0, length);
    onChange(joined);
    if (joined.length === length) onComplete?.(joined);
  };

  const handleChange = (index: number, text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length === 0) {
      const chars = value.split("");
      chars[index] = "";
      setDigits(chars.join(""));
      return;
    }
    if (cleaned.length > 1) {
      setDigits(cleaned);
      const focusIdx = Math.min(cleaned.length, length) - 1;
      inputs.current[Math.max(0, focusIdx)]?.focus();
      return;
    }
    const chars = value.padEnd(length, " ").split("");
    chars[index] = cleaned;
    const joined = chars.join("").replace(/\s/g, "");
    setDigits(joined);
    if (cleaned && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, e: TextInputKeyPressEvent) => {
    if (e.nativeEvent.key !== "Backspace") return;
    if (value[index]) {
      const chars = value.split("");
      chars[index] = "";
      setDigits(chars.join(""));
      return;
    }
    if (index > 0) {
      const chars = value.split("");
      chars[index - 1] = "";
      setDigits(chars.join(""));
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View>
      <View style={styles.row}>
        {Array.from({ length }).map((_, i) => {
          const char = value[i] ?? "";
          const filled = char.length > 0;
          const isActive = value.length === i || (i === length - 1 && filled);
          const borderColor = isActive || filled ? colors.primary : "#9E9E9E";
          return (
            <TextInput
              key={i}
              ref={(r) => {
                inputs.current[i] = r;
              }}
              value={filled ? (obscure ? "*" : char) : ""}
              onChangeText={(t) => handleChange(i, t)}
              onKeyPress={(e) => handleKeyPress(i, e)}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              maxLength={length}
              autoFocus={autoFocus && i === 0}
              selectTextOnFocus
              style={[
                styles.cell,
                {
                  borderBottomColor: borderColor,
                  color: colors.primary,
                },
              ]}
            />
          );
        })}
      </View>
      {error ? (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      ) : (
        <View style={styles.errorSpace} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  cell: {
    flex: 1,
    maxWidth: 48,
    height: 50,
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "NeueMontreal-Bold",
    textAlign: "center",
    borderBottomWidth: 2,
    paddingVertical: 8,
  },
  error: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: "NeueMontreal-Regular",
    minHeight: 22,
  },
  errorSpace: {
    height: 30,
  },
});
