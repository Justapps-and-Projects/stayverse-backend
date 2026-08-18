import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { spacing } from "../theme/tokens";
import { Text } from "../theme/Text";
import { Button } from "./Button";

export type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.wrap, style]}>
      {icon}
      <Text variant="h3" style={styles.title}>
        {title}
      </Text>
      {description ? (
        <Text variant="body" muted style={styles.desc}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} fullWidth={false} style={styles.btn} />
      ) : null}
    </View>
  );
}

/** Back-compat Phase 1 placeholder */
export function StayversePlaceholder({ label = "Stayverse UI" }: { label?: string }) {
  return <EmptyState title={label} description="Design system package" />;
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    textAlign: "center",
  },
  desc: {
    textAlign: "center",
    maxWidth: 320,
  },
  btn: {
    marginTop: spacing.sm,
    minWidth: 160,
  },
});
