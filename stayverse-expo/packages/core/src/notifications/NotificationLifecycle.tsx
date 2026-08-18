import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import {
  configurePushUi,
  pushDeviceToken,
  startPushListeners,
  type PushUiHandlers,
} from "./push";

type Props = PushUiHandlers;

/**
 * Mount once under authenticated app shell (after QueryClientProvider).
 * Flutter registered the FCM token ~2s after dashboard mount.
 */
export function NotificationLifecycle({ showToast, navigate }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    configurePushUi({ showToast, navigate });
  }, [showToast, navigate]);

  useEffect(() => {
    let stop: (() => void) | undefined;
    void startPushListeners().then((unsub) => {
      stop = unsub;
    });
    return () => stop?.();
  }, []);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !accessToken) return;
    const t = setTimeout(() => {
      void pushDeviceToken();
    }, 2000);
    return () => clearTimeout(t);
  }, [isHydrated, isAuthenticated, accessToken]);

  return null;
}
