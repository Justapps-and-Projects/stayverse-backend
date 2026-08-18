import { useEffect, useMemo, useRef } from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type LatLng,
  type Region,
} from "react-native-maps";
import { apartmentMarkerPng, mapStyleJson } from "@stayverse/assets";
import { DEFAULT_MAP_LOCATION, type StayverseCoords } from "../location/location";
import type { MapMarkerData } from "../stores/mapStore";

const mapStyle = mapStyleJson as import("react-native-maps").MapStyleElement[];
const apartmentMarker = apartmentMarkerPng;

export type StayverseMapProps = {
  style?: StyleProp<ViewStyle>;
  markers?: MapMarkerData[];
  initialCoords?: StayverseCoords;
  detailMode?: boolean;
  showsUserLocation?: boolean;
  onMarkerPress?: (id: string) => void;
  onRegionChangeComplete?: (region: Region) => void;
  liveLocation?: StayverseCoords | null;
  fitToMarkers?: boolean;
  children?: React.ReactNode;
};

function toRegion(coords: StayverseCoords, detail: boolean): Region {
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    latitudeDelta: detail ? 0.005 : 0.04,
    longitudeDelta: detail ? 0.005 : 0.04,
  };
}

function boundsFor(markers: MapMarkerData[]): Region | null {
  if (markers.length === 0) return null;
  const lats = markers.map((m) => m.latitude);
  const lngs = markers.map((m) => m.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.6),
    longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.6),
  };
}

export function StayverseMap({
  style,
  markers = [],
  initialCoords = DEFAULT_MAP_LOCATION,
  detailMode = false,
  showsUserLocation = true,
  onMarkerPress,
  onRegionChangeComplete,
  liveLocation,
  fitToMarkers = false,
  children,
}: StayverseMapProps) {
  const mapRef = useRef<MapView>(null);
  const initial = useMemo(
    () => toRegion(initialCoords, detailMode),
    [initialCoords, detailMode],
  );

  useEffect(() => {
    if (!fitToMarkers || markers.length === 0) return;
    const region = boundsFor(markers);
    if (region) mapRef.current?.animateToRegion(region, 400);
  }, [fitToMarkers, markers]);

  useEffect(() => {
    if (!detailMode) return;
    mapRef.current?.animateCamera(
      {
        center: {
          latitude: initialCoords.latitude,
          longitude: initialCoords.longitude,
        },
        zoom: 18,
        pitch: 60,
        heading: 0,
      },
      { duration: 400 },
    );
  }, [detailMode, initialCoords]);

  return (
    <MapView
      ref={mapRef}
      style={[styles.fill, style]}
      provider={PROVIDER_GOOGLE}
      customMapStyle={mapStyle}
      initialRegion={initial}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={false}
      showsCompass={detailMode}
      toolbarEnabled={false}
      onRegionChangeComplete={onRegionChangeComplete}
    >
      {markers.map((m) => (
        <Marker
          key={m.id}
          coordinate={{ latitude: m.latitude, longitude: m.longitude }}
          title={m.priceLabel ?? m.title}
          description={m.subtitle}
          onPress={() => onMarkerPress?.(m.id)}
          image={detailMode ? apartmentMarker : undefined}
          pinColor={detailMode ? undefined : "#FBC036"}
        />
      ))}
      {liveLocation ? (
        <Marker
          coordinate={liveLocation as LatLng}
          title="Live"
          pinColor="#011369"
        />
      ) : null}
      {children}
    </MapView>
  );
}

/** Flutter ApartmentMapView / CarMapView embed. */
export function DetailMapEmbed({
  coords,
  address,
  height = 150,
}: {
  coords: StayverseCoords | null | undefined;
  address?: string;
  height?: number;
}) {
  const point = coords ?? DEFAULT_MAP_LOCATION;
  return (
    <View style={[styles.embed, { height }]}>
      <StayverseMap
        detailMode
        initialCoords={point}
        showsUserLocation
        markers={[
          {
            id: "detail",
            latitude: point.latitude,
            longitude: point.longitude,
            title: address ?? "Location",
            subtitle: "Your location",
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, width: "100%", height: "100%" },
  embed: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F2F2F2",
  },
});
