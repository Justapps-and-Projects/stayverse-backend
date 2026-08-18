import type { LocationSubscription } from "expo-location";
import { getEnv } from "../config/env";
import { socketEmit } from "../realtime/events";
import { socketListen } from "../realtime/events";
import { useMapStore } from "../stores/mapStore";
import {
  watchPosition,
  type StayverseCoords,
} from "./location";

let subscription: LocationSubscription | null = null;
let unlistenUpdated: (() => void) | null = null;

/**
 * Agent live tracking — Flutter defined socket emit `driver.updateLocation`
 * and listen `updated`, but call sites were unused. Wired here for Phase 10.
 */
export async function startLiveLocationBroadcast(): Promise<boolean> {
  if (getEnv().APP_TARGET !== "agent") return false;
  await stopLiveLocationBroadcast();

  subscription = await watchPosition(
    (coords) => {
      socketEmit.driverUpdateLocation({
        lat: coords.latitude,
        lng: coords.longitude,
      });
      useMapStore.getState().setLiveLocation(coords);
    },
    { distanceInterval: 5 },
  );

  return subscription != null;
}

export async function stopLiveLocationBroadcast(): Promise<void> {
  subscription?.remove();
  subscription = null;
}

/** Consume Flutter `updated` events into mapStore live marker. */
export function bindLiveLocationSocketListener(): () => void {
  unlistenUpdated?.();
  unlistenUpdated = socketListen.onLocationUpdated((payload) => {
    const coords: StayverseCoords = {
      latitude: payload.lat,
      longitude: payload.lng,
    };
    useMapStore.getState().setLiveLocation(coords);
  });
  return () => {
    unlistenUpdated?.();
    unlistenUpdated = null;
  };
}
