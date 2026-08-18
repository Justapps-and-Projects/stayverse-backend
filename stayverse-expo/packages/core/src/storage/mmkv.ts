/**
 * Typed MMKV wrapper for non-sensitive key-value persistence.
 * Sensitive data (auth tokens, user session JSON) must use SecureStore — see secureStorage.ts.
 *
 * Falls back to in-memory when the native MMKV / Nitro module is unavailable
 * (Expo Go, web, unit tests) or throws during init. Never blocks the JS thread.
 */

type MmkvLike = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string | number | boolean) => void;
  remove: (key: string) => void;
  clearAll: () => void;
  contains: (key: string) => boolean;
  getAllKeys: () => string[];
};

const memory = new Map<string, string>();

const memoryBackend: MmkvLike = {
  getString: (key) => memory.get(key),
  set: (key, value) => {
    memory.set(key, String(value));
  },
  remove: (key) => {
    memory.delete(key);
  },
  clearAll: () => memory.clear(),
  contains: (key) => memory.has(key),
  getAllKeys: () => [...memory.keys()],
};

let instance: MmkvLike | null = null;
let usingNative = false;
let nativeInitFailed = false;

function getBackend(): MmkvLike {
  if (instance) return instance;
  if (nativeInitFailed) {
    instance = memoryBackend;
    return instance;
  }
  try {
    // Lazy require so Vitest / web don't explode at import time
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createMMKV } = require("react-native-mmkv") as {
      createMMKV: (opts?: { id?: string }) => MmkvLike;
    };
    instance = createMMKV({ id: "stayverse.mmkv" });
    // Smoke-read to force Nitro hybrid object init; if this throws we fall back.
    void instance.getString("__stayverse_mmkv_probe__");
    usingNative = true;
  } catch (e) {
    nativeInitFailed = true;
    usingNative = false;
    instance = memoryBackend;
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn("[mmkv] native unavailable, using memory backend", e);
    }
  }
  return instance;
}

export function isMmkvNative(): boolean {
  getBackend();
  return usingNative;
}

export const mmkv = {
  getString(key: string): string | null {
    return getBackend().getString(key) ?? null;
  },
  setString(key: string, value: string): void {
    getBackend().set(key, value);
  },
  getNumber(key: string): number | null {
    const raw = getBackend().getString(key);
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  },
  setNumber(key: string, value: number): void {
    getBackend().set(key, String(value));
  },
  getBoolean(key: string): boolean | null {
    const raw = getBackend().getString(key);
    if (raw == null) return null;
    if (raw === "true") return true;
    if (raw === "false") return false;
    return null;
  },
  setBoolean(key: string, value: boolean): void {
    getBackend().set(key, value ? "true" : "false");
  },
  getJson<T>(key: string): T | null {
    const raw = getBackend().getString(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setJson(key: string, value: unknown): void {
    getBackend().set(key, JSON.stringify(value));
  },
  remove(key: string): void {
    getBackend().remove(key);
  },
  contains(key: string): boolean {
    return getBackend().contains(key);
  },
  clearAll(): void {
    getBackend().clearAll();
  },
  getAllKeys(): string[] {
    return getBackend().getAllKeys();
  },
};

/** Zustand persist storage adapter (sync) backed by MMKV. */
export const mmkvStorage = {
  getItem: (name: string): string | null => mmkv.getString(name),
  setItem: (name: string, value: string): void => {
    mmkv.setString(name, value);
  },
  removeItem: (name: string): void => {
    mmkv.remove(name);
  },
};

/** Well-known non-sensitive keys (mirrors Flutter SharedPreferences names where possible). */
export const StorageKeys = {
  theme: "stayverse.theme",
  onboarding: "stayverse.onboarding",
  searchFilters: "stayverse.search.filters",
  recentSearch: "recent.search.storage.key",
  lastScreen: "screenStorageScreen.key",
  sessionMeta: "session.user.key",
  deviceToken: "deviceToken",
  rideId: "ride.Id.Key",
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
