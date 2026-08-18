import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import {
  connectStreamUser,
  disconnectStreamUser,
  getStreamClient,
} from "../chat/streamClient";
import { useStreamUiStore } from "../chat/streamUiStore";

/**
 * Connect Stream on auth (Flutter dashboard ~2s delay) and disconnect on logout.
 * Mount once inside StreamChatProvider.
 */
export function useStreamChatConnect() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const chatToken = useAuthStore((s) => s.chatToken);
  const ready = useStreamUiStore((s) => s.ready);
  const setReady = useStreamUiStore((s) => s.setReady);

  useEffect(() => {
    if (!isHydrated) return;

    let cancelled = false;

    const run = async () => {
      if (isAuthenticated && user && chatToken) {
        await new Promise((r) => setTimeout(r, 2000));
        if (cancelled) return;
        try {
          await connectStreamUser({ user, chatToken });
          if (!cancelled) setReady(true);
        } catch (e) {
          if (typeof __DEV__ !== "undefined" && __DEV__) {
            console.warn("[stream] connect failed", e);
          }
          if (!cancelled) setReady(false);
        }
      } else {
        await disconnectStreamUser();
        if (!cancelled) setReady(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [isHydrated, isAuthenticated, user, chatToken, setReady]);

  return {
    client: getStreamClient(),
    ready,
  };
}
