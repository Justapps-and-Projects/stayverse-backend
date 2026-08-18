import { StyleSheet, View } from "react-native";
import { Text, spacing, useTheme } from "@stayverse/ui";

type PlaceholderTabProps = {
  title: string;
  description?: string;
};

export function PlaceholderTab({ title, description }: PlaceholderTabProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="h3">{title}</Text>
      <Text variant="body" muted>
        {description ?? "Phase 3 placeholder"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
});
