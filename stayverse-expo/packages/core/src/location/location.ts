import * as Location from "expo-location";
import {
  type StayverseCoords,
  DEFAULT_MAP_LOCATION,
  LAGOS_BIAS_CENTER,
  distanceBetweenMeters,
  coordsFromGeoJson,
} from "./coords";

export type {
  StayverseCoords,
} from "./coords";
export {
  DEFAULT_MAP_LOCATION,
  LAGOS_BIAS_CENTER,
  distanceBetweenMeters,
  coordsFromGeoJson,
};

function toCoords(pos: Location.LocationObject): StayverseCoords {
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    heading: pos.coords.heading,
    speed: pos.coords.speed,
    timestamp: pos.timestamp,
  };
}

/**
 * Flutter `PermissionManager` + Geolocator when-in-use.
 * Background/Always only when explicitly requested (agent live tracking).
 */
export async function requestForegroundLocationPermission(): Promise<boolean> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.granted) return true;
  const next = await Location.requestForegroundPermissionsAsync();
  return next.granted;
}

export async function requestBackgroundLocationPermission(): Promise<boolean> {
  const fg = await requestForegroundLocationPermission();
  if (!fg) return false;
  const current = await Location.getBackgroundPermissionsAsync();
  if (current.granted) return true;
  const next = await Location.requestBackgroundPermissionsAsync();
  return next.granted;
}

export async function isForegroundLocationGranted(): Promise<boolean> {
  const current = await Location.getForegroundPermissionsAsync();
  return current.granted;
}

/**
 * Flutter `LocationService.currentLocation` —
 * best accuracy with short timeout, fallback to last known.
 */
export async function getCurrentPosition(): Promise<StayverseCoords | null> {
  const granted = await requestForegroundLocationPermission();
  if (!granted) return null;

  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });
    return toCoords(pos);
  } catch {
    try {
      const last = await Location.getLastKnownPositionAsync();
      return last ? toCoords(last) : null;
    } catch {
      return null;
    }
  }
}

export type WatchLocationOptions = {
  distanceInterval?: number;
  timeInterval?: number;
  accuracy?: Location.Accuracy;
};

/**
 * Flutter `LocationService.listenToLocationUpdate` (distanceFilter default 5m).
 */
export async function watchPosition(
  onUpdate: (coords: StayverseCoords) => void,
  options: WatchLocationOptions = {},
): Promise<Location.LocationSubscription | null> {
  const granted = await requestForegroundLocationPermission();
  if (!granted) return null;

  return Location.watchPositionAsync(
    {
      accuracy: options.accuracy ?? Location.Accuracy.Balanced,
      distanceInterval: options.distanceInterval ?? 5,
      timeInterval: options.timeInterval ?? 1000,
    },
    (pos) => onUpdate(toCoords(pos)),
  );
}
