import type { ComponentType } from "react";
import { getEnv } from "../config/env";
import { sentryEnvironmentTag as mapEnvTag } from "./sentryEnv";

type SentryMod = typeof import("@sentry/react-native");

let sentryMod: SentryMod | null | undefined;
/** Opaque handle — avoid exporting Sentry internal option types */
let navigationIntegration: { registerNavigationContainer: (ref: unknown) => void } | null =
  null;
let initialized = false;

function getSentry(): SentryMod | null {
  if (sentryMod !== undefined) return sentryMod;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    sentryMod = require("@sentry/react-native") as SentryMod;
    return sentryMod;
  } catch {
    sentryMod = null;
    return null;
  }
}

/** Flutter-style env tag; defaults to current `getEnv().APP_ENV`. */
export function sentryEnvironmentTag(
  appEnv?: "development" | "staging" | "production",
): string {
  return mapEnvTag(appEnv ?? getEnv().APP_ENV);
}

function releaseAndDist(): { release: string; dist: string } {
  const env = getEnv();
  let version = "1.0.0";
  let build = "0";
  try {
    // Lazy — avoids pulling Expo/RN into Vitest for pure socket/env tests
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require("expo-constants").default as typeof import("expo-constants").default;
    version =
      Constants.expoConfig?.version ??
      Constants.nativeAppVersion ??
      "1.0.0";
    build =
      Constants.nativeBuildVersion ??
      String(
        (Constants.expoConfig?.ios as { buildNumber?: string } | undefined)
          ?.buildNumber ??
          (Constants.expoConfig?.android as { versionCode?: number } | undefined)
            ?.versionCode ??
          "0",
      );
  } catch {
    // tests / non-native
  }
  const slug =
    env.APP_TARGET === "agent" ? "stayverse-agent" : "stayverse-user";
  return {
    release: `${slug}@${version}+${build}`,
    dist: String(build),
  };
}

export function isSentryAvailable(): boolean {
  return getSentry() !== null && Boolean(getEnv().SENTRY_DSN);
}

/**
 * Init once at app root. No-op when DSN empty or native package missing.
 * Captures unhandled JS errors / rejections via SDK defaults + native crashes via Expo plugin.
 */
export function initStayverseSentry(): void {
  if (initialized) return;
  const Sentry = getSentry();
  const dsn = getEnv().SENTRY_DSN?.trim();
  if (!Sentry || !dsn) return;

  const { release, dist } = releaseAndDist();
  const environment = sentryEnvironmentTag();

  const nav = Sentry.reactNavigationIntegration({
    enableTimeToInitialDisplay: true,
  });
  navigationIntegration = nav;

  Sentry.init({
    dsn,
    environment,
    release,
    dist,
    enableAutoSessionTracking: true,
    tracesSampleRate: environment === "PROD" ? 0.2 : 1.0,
    integrations: [nav],
    enableNativeFramesTracking: true,
  });

  Sentry.setTag("app_target", getEnv().APP_TARGET);
  Sentry.setTag("app_env", getEnv().APP_ENV);
  initialized = true;
}

export function getSentryNavigationIntegration(): typeof navigationIntegration {
  return navigationIntegration;
}

export function registerSentryNavigationContainer(ref: unknown): void {
  const Sentry = getSentry();
  if (!Sentry || !navigationIntegration || !ref) return;
  navigationIntegration.registerNavigationContainer(ref);
}

export function addStayverseBreadcrumb(
  message: string,
  category: "navigation" | "http" | "socket" | "ui" | "auth",
  data?: Record<string, unknown>,
  level: "info" | "warning" | "error" = "info",
): void {
  const Sentry = getSentry();
  if (!Sentry || !initialized) return;
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
    type: category === "http" ? "http" : "default",
  });
}

export function captureStayverseException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const Sentry = getSentry();
  if (!Sentry || !initialized) return;
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

export function setStayverseSentryUser(
  user: { id: string; email?: string | null; username?: string | null } | null,
): void {
  const Sentry = getSentry();
  if (!Sentry || !initialized) return;
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({
    id: user.id,
    email: user.email ?? undefined,
    username: user.username ?? undefined,
  });
}

/** Wrap root component — identity when Sentry unavailable. */
export function wrapWithSentry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: ComponentType<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ComponentType<any> {
  const Sentry = getSentry();
  if (!Sentry) return Component;
  return Sentry.wrap(Component);
}

/** Vitest helper */
export function __resetSentryForTests(): void {
  sentryMod = undefined;
  navigationIntegration = null;
  initialized = false;
}
