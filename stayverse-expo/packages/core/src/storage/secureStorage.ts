import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * SecureStore adapter for Zustand persist.
 * Falls back to in-memory on unsupported environments (e.g. SSR).
 * Every native call is bounded so a hung SecureStore never blocks AuthGate forever.
 */
const memory = new Map<string, string>();

const SECURE_STORE_TIMEOUT_MS = 1500;

function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(fallback);
      }
    }, SECURE_STORE_TIMEOUT_MS);

    promise
      .then((value) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(value);
        }
      })
      .catch(() => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(fallback);
        }
      });
  });
}

async function canUseSecureStore(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    return await withTimeout(SecureStore.isAvailableAsync(), false);
  } catch {
    return false;
  }
}

export const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (!(await canUseSecureStore())) {
      return memory.get(name) ?? null;
    }
    try {
      return await withTimeout(SecureStore.getItemAsync(name), memory.get(name) ?? null);
    } catch {
      return memory.get(name) ?? null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    memory.set(name, value);
    if (!(await canUseSecureStore())) return;
    try {
      await withTimeout(SecureStore.setItemAsync(name, value), undefined);
    } catch {
      // memory already set
    }
  },
  removeItem: async (name: string): Promise<void> => {
    memory.delete(name);
    if (!(await canUseSecureStore())) return;
    try {
      await withTimeout(SecureStore.deleteItemAsync(name), undefined);
    } catch {
      // ignore
    }
  },
};
