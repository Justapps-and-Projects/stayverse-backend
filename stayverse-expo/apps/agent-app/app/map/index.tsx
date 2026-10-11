import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Stack, router, Redirect, type Href } from "expo-router";
import {
  LocationMapPicker,
  PlacesAutocompleteField,
  type PickedLocation,
  type PlaceSuggestion,
} from "@stayverse/core";
import { Text, spacing, useTheme } from "@stayverse/ui";

/**
 * Agent location tools — map picker (chef) + Places autocomplete (adverts).
 */
export default function AgentMapScreen() {
  const { colors } = useTheme();
  const [mode, setMode] = useState<"picker" | "search">("picker");
  const [picked, setPicked] = useState<PickedLocation | null>(null);
  const [place, setPlace] = useState<PlaceSuggestion | null>(null);

  const onConfirm = useCallback((value: PickedLocation) => {
    setPicked(value);
  }, []);

  if (!__DEV__) return <Redirect href={"/(tabs)" as Href} />;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Location",
          headerLeft: () => (
            <Text
              variant="bodyBold"
              style={{ color: colors.primary, paddingHorizontal: spacing.md }}
              onPress={() => router.back()}
            >
              Back
            </Text>
          ),
        }}
      />

      <View style={styles.tabs}>
        <Text
          variant="bodyBold"
          style={{ color: mode === "picker" ? colors.primary : colors.muted }}
          onPress={() => setMode("picker")}
        >
          Map picker
        </Text>
        <Text
          variant="bodyBold"
          style={{ color: mode === "search" ? colors.primary : colors.muted }}
          onPress={() => setMode("search")}
        >
          Places search
        </Text>
      </View>

      {mode === "picker" ? (
        <LocationMapPicker onConfirm={onConfirm} />
      ) : (
        <View style={styles.pad}>
          <PlacesAutocompleteField onSelect={setPlace} />
          {place ? (
            <Text variant="bodySmall" muted>
              placeId: {place.placeId}
            </Text>
          ) : null}
        </View>
      )}

      {picked ? (
        <View style={styles.result}>
          <Text variant="bodySmall" muted>
            Confirmed: {picked.formattedAddress ?? "—"}
          </Text>
          <Text variant="bodySmall" muted>
            {picked.coords.latitude.toFixed(5)}, {picked.coords.longitude.toFixed(5)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tabs: {
    flexDirection: "row",
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pad: { padding: spacing.lg, gap: spacing.sm },
  result: {
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E1E1E1",
  },
});
