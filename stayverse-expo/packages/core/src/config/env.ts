import { z } from "zod";
import Constants from "expo-constants";

/**
 * Env schema — mirrors Flutter Envied vars from Stayverse `.env`.
 * Values are injected via `app.config.ts` → `expo.extra.stayverse`.
 */
const stayverseEnvSchema = z.object({
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  APP_TARGET: z.enum(["user", "agent"]).default("user"),
  /** Flutter HOST_DEV / HOST_PROD */
  API_BASE_URL: z.string().url(),
  /** Optional socket host (defaults to API_BASE_URL) */
  SOCKET_URL: z.string().url().optional(),
  GOOGLE_API_KEY: z.string().optional().default(""),
  GET_STREAM_KEY: z.string().optional().default(""),
  /** Flutter SENTRY_DNS typo preserved as source name; we expose both */
  SENTRY_DSN: z.string().optional().default(""),
  AUTH_USER_KEY: z.string().default("auth.user.key"),
  TOKEN_KEY: z.string().default("token.key"),
  CHAT_TOKEN_KEY: z.string().default("chat.token.key"),
  SCREEN_STORAGE_KEY: z.string().default("screenStorageScreen.key"),
  SESSION_STORAGE_KEY: z.string().default("session.user.key"),
  RECENT_SEARCH_STORAGE_KEY: z.string().default("recent.search.storage.key"),
});

export type StayverseEnv = z.infer<typeof stayverseEnvSchema>;

type Extra = {
  stayverse?: Partial<Record<string, string>>;
};

function readExtra(): Partial<Record<string, string>> {
  const extra = (Constants.expoConfig?.extra ?? {}) as Extra;
  return extra.stayverse ?? {};
}

function readProcessFallback(): Partial<Record<string, string>> {
  return {
    APP_ENV: process.env.APP_ENV ?? process.env.EXPO_PUBLIC_APP_ENV,
    APP_TARGET: process.env.EXPO_PUBLIC_APP_TARGET,
    API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
    SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL,
    GOOGLE_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
    GET_STREAM_KEY: process.env.EXPO_PUBLIC_GET_STREAM_KEY,
    SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  };
}

/** Defaults match Flutter HOST_* (Render). Overridden by app config / env files. */
const defaults: StayverseEnv = {
  APP_ENV: "development",
  APP_TARGET: "user",
  API_BASE_URL: "https://stayverse-backend-lzlu.onrender.com",
  SOCKET_URL: undefined,
  GOOGLE_API_KEY: "",
  GET_STREAM_KEY: "",
  SENTRY_DSN: "",
  AUTH_USER_KEY: "auth.user.key",
  TOKEN_KEY: "token.key",
  CHAT_TOKEN_KEY: "chat.token.key",
  SCREEN_STORAGE_KEY: "screenStorageScreen.key",
  SESSION_STORAGE_KEY: "session.user.key",
  RECENT_SEARCH_STORAGE_KEY: "recent.search.storage.key",
};

let cached: StayverseEnv | null = null;

export function getEnv(): StayverseEnv {
  if (cached) return cached;
  const merged = {
    ...defaults,
    ...readProcessFallback(),
    ...readExtra(),
  };
  if (!merged.SOCKET_URL) {
    merged.SOCKET_URL = merged.API_BASE_URL;
  }
  cached = stayverseEnvSchema.parse(merged);
  return cached;
}

export function resetEnvCache() {
  cached = null;
}

export { stayverseEnvSchema };
