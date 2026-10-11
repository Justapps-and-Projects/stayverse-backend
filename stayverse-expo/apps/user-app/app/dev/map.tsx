import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Stack, Redirect, type Href } from "expo-router";
import {
  DetailMapEmbed,
  PlacesAutocompleteField,
  SearchMapView,
  requestForegroundLocationPermission,
  useMapStore,
  type PlaceSuggestion,
} from "@stayverse/core";
import { Text, spacing, useTheme } from "@stayverse/ui";

const DEMO_MARKERS = [
  {
    id: "apt-1",
    latitude: 6.6018,
    longitude: 3.3515,
    title: "Ikeja apartment",
    priceLabel: "₦45,000",
    subtitle: "2 beds · Ikeja",
  },
  {
    id: "ride-1",
    latitude: 6.5244,
    longitude: 3.3792,
    title: "Lagos ride",
    priceLabel: "₦8,500",
    subtitle: "SUV · Mainland",
  },
];

/**
 * Phase 10 kitchen sink — search map + detail embed + Places autocomplete.
 * Flutter: SearchMapView, CarMapView/ApartmentMapView, ride pickup field.
 */
export default function MapDevScreen() {
  const { colors } = useTheme();
  const setMarkers = useMapStore((s) => s.setMarkers);
  const [place, setPlace] = useState<PlaceSuggestion | null>(null);

  useEffect(() => {
    setMarkers(DEMO_MARKERS);
    void requestForegroundLocationPermission();
  }, [setMarkers]);

  if (!__DEV__) return <Redirect href={"/(tabs)" as Href} />;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: true, title: "Maps" }} />
      <View style={styles.map}>
        <SearchMapView />
      </View>
      <View style={styles.panel}>
        <Text variant="h3">Places</Text>
        <PlacesAutocompleteField
          onSelect={(s) => setPlace(s)}
          value={place?.description}
        />
        {place ? (
          <Text variant="bodySmall" muted>
            placeId: {place.placeId}
          </Text>
        ) : null}
        <Text variant="bodyBold">Detail embed</Text>
        <DetailMapEmbed
          coords={{ latitude: 6.6018, longitude: 3.3515 }}
          address="Sample listing"
          height={150}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  map: { flex: 1 },
  panel: {
    padding: spacing.lg,
    gap: spacing.sm,
    maxHeight: "48%",
  },
});
