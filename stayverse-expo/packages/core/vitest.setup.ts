import { vi } from "vitest";

(globalThis as { __DEV__?: boolean }).__DEV__ = true;

vi.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {
        stayverse: {
          API_BASE_URL: "https://example.com",
          APP_TARGET: "user",
          APP_ENV: "development",
        },
      },
    },
  },
}));

vi.mock("expo-secure-store", () => ({
  isAvailableAsync: vi.fn(async () => false),
  getItemAsync: vi.fn(async () => null),
  setItemAsync: vi.fn(async () => undefined),
  deleteItemAsync: vi.fn(async () => undefined),
}));

vi.mock("expo-location", () => ({
  getForegroundPermissionsAsync: vi.fn(async () => ({ granted: true })),
  requestForegroundPermissionsAsync: vi.fn(async () => ({ granted: true })),
  getCurrentPositionAsync: vi.fn(),
  watchPositionAsync: vi.fn(),
  Accuracy: { Balanced: 3 },
}));

vi.mock("react-native", () => ({
  Platform: { OS: "ios", select: (v: Record<string, unknown>) => v.ios },
  StyleSheet: { create: (s: unknown) => s },
  View: "View",
  Text: "Text",
  Pressable: "Pressable",
  Image: "Image",
  Alert: { alert: vi.fn() },
  Linking: { openURL: vi.fn() },
  NativeModules: {},
}));

vi.mock("react-native-mmkv", () => {
  const store = new Map<string, string>();
  return {
    createMMKV: () => ({
      getString: (key: string) => store.get(key),
      set: (key: string, value: string | number | boolean) => {
        store.set(key, String(value));
      },
      remove: (key: string) => {
        store.delete(key);
      },
      clearAll: () => store.clear(),
      contains: (key: string) => store.has(key),
      getAllKeys: () => [...store.keys()],
    }),
  };
});
