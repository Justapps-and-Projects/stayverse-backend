import { useCallback, useEffect } from "react";
import { router, type Href } from "expo-router";
import { NotificationLifecycle, setAnalyticsUserId, useAuthStore } from "@stayverse/core";
import { showToast } from "@stayverse/ui";

/**
 * App-level Firebase push + light analytics user id sync.
 * Native messaging requires a dev client / EAS build (not Expo Go).
 */
export function FirebaseBootstrap() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const onToast = useCallback(
    (payload: { title: string; message: string }) => {
      showToast({ type: "info", title: payload.title, message: payload.message });
    },
    [],
  );

  const onNavigate = useCallback((href: string) => {
    router.push(href as Href);
  }, []);

  useEffect(() => {
    void setAnalyticsUserId(isAuthenticated ? userId : null);
  }, [isAuthenticated, userId]);

  return (
    <NotificationLifecycle showToast={onToast} navigate={onNavigate} />
  );
}
