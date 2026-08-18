import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { radius, spacing } from "../theme/tokens";
import { Text } from "../theme/Text";
import { useThemeColors } from "../theme/ThemeProvider";

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toIsoDateTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${toIsoDate(d)}T${h}:${min}`;
}

function parseDate(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const d = value.includes("T")
    ? new Date(value)
    : new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export type DatePickerFieldProps = {
  label?: string;
  value: string;
  onChange: (iso: string) => void;
  mode?: "date" | "datetime";
  minimumDate?: Date;
  maximumDate?: Date;
  placeholder?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function DatePickerField({
  label,
  value,
  onChange,
  mode = "date",
  minimumDate,
  maximumDate,
  placeholder = "Select date",
  error,
  containerStyle,
}: DatePickerFieldProps) {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const initial = parseDate(value, minimumDate ?? new Date());

  const display = (() => {
    if (!value) return placeholder;
    const d = parseDate(value, new Date());
    if (mode === "datetime") {
      return d.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  })();

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setOpen(false);
    if (event.type === "dismissed" || !selected) return;
    onChange(mode === "datetime" ? toIsoDateTime(selected) : toIsoDate(selected));
  };

  const picker = (
    <DateTimePicker
      value={parseDate(value, initial)}
      mode={mode}
      display={Platform.OS === "ios" ? "spinner" : "default"}
      minimumDate={minimumDate}
      maximumDate={maximumDate}
      onChange={onPickerChange}
    />
  );

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? (
        <Text variant="bodySmallBold" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          {
            borderColor: error ? colors.error : colors.border,
            backgroundColor: colors.surface,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
      >
        <Text style={{ color: value ? colors.text : colors.muted, flex: 1 }}>
          {display}
        </Text>
        <Ionicons name="calendar-outline" size={22} color={colors.primary} />
      </Pressable>
      {error ? (
        <Text variant="caption" style={{ color: colors.error }}>
          {error}
        </Text>
      ) : null}

      {Platform.OS === "ios" ? (
        <Modal visible={open} transparent animationType="slide">
          <Pressable style={styles.sheetOverlay} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHeader}>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Text style={{ color: colors.primary, fontWeight: "600" }}>Done</Text>
              </Pressable>
            </View>
            {open ? picker : null}
          </View>
        </Modal>
      ) : open ? (
        picker
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, width: "100%" },
  label: { marginBottom: 2 },
  field: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: spacing.xl,
  },
  sheetHeader: {
    alignItems: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
});
