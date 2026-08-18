export type StayverseCoords = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
};

/** Flutter `Constant.defaultLocation` — Ikeja / Lagos fallback */
export const DEFAULT_MAP_LOCATION: StayverseCoords = {
  latitude: 6.6018,
  longitude: 3.3515,
};

/** Places autocomplete bias center (Flutter BrimPlace) */
export const LAGOS_BIAS_CENTER: StayverseCoords = {
  latitude: 6.5244,
  longitude: 3.3792,
};

/** Haversine distance in meters (Flutter SphericalUtils.computeDistanceBetween). */
export function distanceBetweenMeters(
  a: StayverseCoords,
  b: StayverseCoords,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** GeoJSON `[lng, lat]` → map coords (Flutter ServiceLocation.latLng). */
export function coordsFromGeoJson(
  coordinates: [number, number] | number[] | null | undefined,
): StayverseCoords | null {
  if (!coordinates || coordinates.length < 2) return null;
  const [lng, lat] = coordinates;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { latitude: lat, longitude: lng };
}
