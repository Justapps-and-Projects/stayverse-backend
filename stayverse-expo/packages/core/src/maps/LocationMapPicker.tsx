import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Region } from "react-native-maps";
import {
  DEFAULT_MAP_LOCATION,
  getCurrentPosition,
  type StayverseCoords,
} from "../location/location";
import { reverseGeocode } from "../location/places";
import { StayverseMap } from "./StayverseMap";

export type PickedLocation = {
  coords: StayverseCoords;
  placeId: string | null;
  formattedAddress: string | null;
};

type Props = {
  onConfirm: (picked: PickedLocation) => void;
  initial?: StayverseCoords | null;
};

/** Flutter chef map location picker — center pin + reverse geocode on idle. */
export function LocationMapPicker({ onConfirm, initial }: Props) {
  const [center, setCenter] = useState<StayverseCoords>(
    initial ?? DEFAULT_MAP_LOCATION,
  );
  const [address, setAddress] = useState<string | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshAddress = useCallback(async (coords: StayverseCoords) => {
    setBusy(true);
    const result = await reverseGeocode(coords);
    setAddress(result?.formattedAddress ?? null);
    setPlaceId(result?.placeId ?? null);
    setBusy(false);
  }, []);

  useEffect(() => {
    void refreshAddress(center);
  }, []);

  const onRegionChangeComplete = useCallback(
    (region: Region) => {
      const next = {
        latitude: region.latitude,
        longitude: region.longitude,
      };
      setCenter(next);
      void refreshAddress(next);
    },
    [refreshAddress],
  );

  const goMyLocation = useCallback(async () => {
    const pos = await getCurrentPosition();
    if (!pos) return;
    setCenter(pos);
    void refreshAddress(pos);
  }, [refreshAddress]);

  return (
    <View style={styles.flex}>
      <View style={styles.mapWrap}>
        <StayverseMap
          initialCoords={center}
          showsUserLocation
          onRegionChangeComplete={onRegionChangeComplete}
        />
        <View pointerEvents="none" style={styles.pinWrap}>
          <View style={styles.pin} />
          <View style={styles.pinStem} />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.muted}>
          {busy ? "Resolving address…" : address ?? "Move the map to set location"}
        </Text>
        <Pressable onPress={goMyLocation}>
          <Text style={styles.link}>Use my location</Text>
        </Pressable>
        <Pressable
          style={styles.confirm}
          onPress={() =>
            onConfirm({
              coords: center,
              placeId,
              formattedAddress: address,
            })
          }
        >
          <Text style={styles.confirmText}>Confirm location</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  mapWrap: { flex: 1 },
  pinWrap: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -10,
    marginTop: -28,
    alignItems: "center",
  },
  pin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FBC036",
    borderWidth: 3,
    borderColor: "#011369",
  },
  pinStem: {
    width: 3,
    height: 12,
    backgroundColor: "#011369",
    marginTop: -2,
  },
  footer: {
    padding: 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E1E1E1",
    backgroundColor: "#FFFFFF",
  },
  muted: { fontSize: 13, color: "#7D7873" },
  link: { fontSize: 15, fontWeight: "700", color: "#FBC036" },
  confirm: {
    backgroundColor: "#FBC036",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmText: { fontSize: 16, fontWeight: "700", color: "#232C33" },
});
