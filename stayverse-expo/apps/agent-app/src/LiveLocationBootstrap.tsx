import { useEffect } from "react";
import {
  bindLiveLocationSocketListener,
  startLiveLocationBroadcast,
  stopLiveLocationBroadcast,
  useAuthStore,
} from "@stayverse/core";

/** Ride agents broadcast live location while signed in. */
export function LiveLocationBootstrap() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const serviceType = useAuthStore((s) => s.serviceType);

  useEffect(() => {
    if (!isAuthenticated || serviceType !== "ride") {
      void stopLiveLocationBroadcast();
      return;
    }
    void startLiveLocationBroadcast();
    const unbind = bindLiveLocationSocketListener();
    return () => {
      unbind();
      void stopLiveLocationBroadcast();
    };
  }, [isAuthenticated, serviceType]);

  return null;
}
