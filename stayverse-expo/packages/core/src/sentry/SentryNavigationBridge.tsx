import { useEffect } from "react";
import { useNavigationContainerRef, usePathname, useSegments } from "expo-router";
import {
  addStayverseBreadcrumb,
  getSentryNavigationIntegration,
  registerSentryNavigationContainer,
} from "./sentry";

/**
 * Registers Expo Router nav container with Sentry + route breadcrumbs.
 * Mount once under the root Stack (after initStayverseSentry).
 */
export function SentryNavigationBridge() {
  const ref = useNavigationContainerRef();
  const pathname = usePathname();
  const segments = useSegments();

  useEffect(() => {
    if (ref) {
      registerSentryNavigationContainer(ref);
    }
  }, [ref]);

  useEffect(() => {
    if (!getSentryNavigationIntegration()) return;
    addStayverseBreadcrumb(`Navigated to ${pathname}`, "navigation", {
      pathname,
      segments: segments.join("/"),
    });
  }, [pathname, segments]);

  return null;
}
