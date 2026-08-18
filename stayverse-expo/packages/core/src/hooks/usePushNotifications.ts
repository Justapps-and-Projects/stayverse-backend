import { useEffect } from "react";
import {
  configurePushUi,
  pushDeviceToken,
  startPushListeners,
  type PushUiHandlers,
} from "../notifications/push";
import { useAuthStore } from "../stores/authStore";

/** Hook form of NotificationLifecycle for screens that prefer hooks. */
export function usePushNotifications(ui: PushUiHandlers = {}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    configurePushUi(ui);
  }, [ui.showToast, ui.navigate]);

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
}
