import { StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import {
  useListingDetailsQuery,
  type CatalogServiceType,
} from "@stayverse/core";
import { LoadingSpinner, Text, spacing, useTheme } from "@stayverse/ui";
import { ListingDetailContent } from "../../../src/features/listing/ListingDetailContent";

function parseKind(type: string | undefined): CatalogServiceType | null {
  if (type === "apartment" || type === "ride" || type === "chef") return type;
  return null;
}

/** Flutter apartment / ride / chef detail — fetched by id. */
export default function ListingDetailScreen() {
  const { colors } = useTheme();
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>();
  const kind = parseKind(type);
  const query = useListingDetailsQuery(kind ?? undefined, id);

  const title = kind === "chef" ? "" : "Details";

  if (!kind || !id) {
    return (
      <View style={[styles.wrap, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: true, title: "Details" }} />
        <Text muted>Invalid listing</Text>
      </View>
    );
  }

  if (query.isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: true, title }} />
        <LoadingSpinner />
      </View>
    );
  }

  if (!query.data) {
    return (
      <View style={[styles.wrap, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: true, title }} />
        <Text muted>Listing not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: true, title }} />
      <ListingDetailContent listing={query.data} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  wrap: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
