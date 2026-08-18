/**
 * Flutter tagged `environment.name.toUpperCase()` → DEV / PROD.
 * Pure helper (no Expo/RN) for tests + init.
 */
export function sentryEnvironmentTag(
  appEnv: "development" | "staging" | "production",
): string {
  switch (appEnv) {
    case "development":
      return "DEV";
    case "staging":
      return "STAGING";
    case "production":
      return "PROD";
  }
}
