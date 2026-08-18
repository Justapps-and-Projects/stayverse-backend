import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { StayverseMap } from "./StayverseMap";
import { useMapStore, type MapMarkerData } from "../stores/mapStore";
import { DEFAULT_MAP_LOCATION } from "../location/location";

type Props = {
  markers?: MapMarkerData[];
  onSelectMarker?: (marker: MapMarkerData) => void;
};

/**
 * Flutter SearchMapView — price/title markers, fit bounds, my location.
 */
export function SearchMapView({ markers: markersProp, onSelectMarker }: Props) {
  const storeMarkers = useMapStore((s) => s.markers);
  const liveLocation = useMapStore((s) => s.liveLocation);
  const setSelectedMarkerId = useMapStore((s) => s.setSelectedMarkerId);
  const selectedMarkerId = useMapStore((s) => s.selectedMarkerId);
  const [sheet, setSheet] = useState<MapMarkerData | null>(null);

  const markers = markersProp ?? storeMarkers;

  const selected = useMemo(
    () => markers.find((m) => m.id === selectedMarkerId) ?? sheet,
    [markers, selectedMarkerId, sheet],
  );

  const onMarkerPress = useCallback(
    (id: string) => {
      setSelectedMarkerId(id);
      const found = markers.find((m) => m.id === id) ?? null;
      setSheet(found);
      if (found) onSelectMarker?.(found);
    },
    [markers, onSelectMarker, setSelectedMarkerId],
  );

  return (
    <View style={styles.flex}>
      <StayverseMap
        markers={markers}
        initialCoords={DEFAULT_MAP_LOCATION}
        showsUserLocation
        fitToMarkers
        liveLocation={liveLocation}
        onMarkerPress={onMarkerPress}
      />
      {selected ? (
        <View style={styles.card}>
          <Text style={styles.title}>{selected.title ?? selected.priceLabel}</Text>
          {selected.subtitle ? (
            <Text style={styles.sub}>{selected.subtitle}</Text>
          ) : null}
          <Pressable onPress={() => setSheet(null)}>
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E1E1E1",
  },
  title: { fontSize: 16, fontWeight: "700", color: "#232C33" },
  sub: { fontSize: 13, color: "#7D7873" },
  close: { marginTop: 8, fontSize: 14, fontWeight: "600", color: "#FBC036" },
});
