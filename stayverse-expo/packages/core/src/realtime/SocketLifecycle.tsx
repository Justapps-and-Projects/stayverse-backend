import { useEffect } from "react";
import { bindLiveLocationSocketListener } from "../location/liveLocation";
import { useSocketConnection } from "../hooks/useSocketConnection";

/**
 * Mount once under QueryClientProvider to keep sockets in sync with auth.
 * Also listens for Flutter `updated` location events → mapStore.
 */
export function SocketLifecycle() {
  useSocketConnection();

  useEffect(() => {
    return bindLiveLocationSocketListener();
  }, []);

  return null;
}
