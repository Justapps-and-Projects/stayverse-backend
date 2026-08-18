import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/authStore";
import { bindSocketQueryBridge } from "../realtime/bridge";
import { bindSocketLifecycle, isSocketConnected } from "../realtime/socket";
import { useSocketStore } from "../realtime/socketStore";

/**
 * Boots socket lifecycle from auth + bridges events into React Query.
 * Screens can read `status` for a connection indicator.
 */
export function useSocketConnection() {
  const queryClient = useQueryClient();
  const status = useSocketStore((s) => s.status);
  const lastError = useSocketStore((s) => s.lastError);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    const unbind = bindSocketLifecycle(() => useAuthStore.getState());
    return unbind;
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    const unbridge = bindSocketQueryBridge(queryClient);
    return unbridge;
  }, [isAuthenticated, accessToken, queryClient]);

  return {
    status,
    lastError,
    isConnected: status === "connected" || isSocketConnected("main"),
  };
}
