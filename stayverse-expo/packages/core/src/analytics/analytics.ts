/**
 * Firebase Analytics wrapper.
 *
 * Flutter declared `firebase_analytics` but never logged custom events,
 * screen views, or setUserId. Keep this module ready with typed helpers;
 * only add event name constants that exist in Flutter (currently none).
 */

export const AnalyticsEvents = {
  /** Intentionally empty — no Flutter custom event names to preserve. */
} as const;

export type AnalyticsEventName = never;

type AnalyticsModule = typeof import("@react-native-firebase/analytics").default;

let analyticsMod: AnalyticsModule | null | undefined;

function getAnalytics(): AnalyticsModule | null {
  if (analyticsMod !== undefined) return analyticsMod;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    analyticsMod = require("@react-native-firebase/analytics").default as AnalyticsModule;
    return analyticsMod;
  } catch {
    analyticsMod = null;
    return null;
  }
}

export function isAnalyticsNativeAvailable(): boolean {
  return getAnalytics() !== null;
}

export async function logEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
): Promise<void> {
  const analytics = getAnalytics();
  if (!analytics) return;
  try {
    await analytics().logEvent(name, params);
  } catch {
    // no-op when native SDK missing / DebugView unavailable
  }
}

export async function logScreenView(screenName: string, screenClass?: string): Promise<void> {
  const analytics = getAnalytics();
  if (!analytics) return;
  try {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass ?? screenName,
    });
  } catch {
    // ignore
  }
}

export async function setAnalyticsUserId(userId: string | null): Promise<void> {
  const analytics = getAnalytics();
  if (!analytics) return;
  try {
    await analytics().setUserId(userId);
  } catch {
    // ignore
  }
}

/** Vitest helper */
export function __resetAnalyticsForTests(): void {
  analyticsMod = undefined;
}
