/**
 * MMKV adapter for theme persistence only.
 * Auth secrets stay in @stayverse/core SecureStore — never use this for tokens.
 */
type MmkvLike = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string | number | boolean) => void;
  remove: (key: string) => void;
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
};

let instance: MmkvLike | null = null;
let nativeInitFailed = false;

function getBackend(): MmkvLike {
  if (instance) return instance;
  if (nativeInitFailed) {
    instance = memoryBackend;
    return instance;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createMMKV } = require("react-native-mmkv") as {
      createMMKV: (opts?: { id?: string }) => MmkvLike;
    };
    instance = createMMKV({ id: "stayverse.mmkv" });
    void instance.getString("__stayverse_theme_mmkv_probe__");
  } catch {
    nativeInitFailed = true;
    instance = memoryBackend;
  }
  return instance;
}

export const themeMmkvStorage = {
  getItem: (name: string): string | null => getBackend().getString(name) ?? null,
  setItem: (name: string, value: string): void => {
    getBackend().set(name, value);
  },
  removeItem: (name: string): void => {
    getBackend().remove(name);
  },
};

export const THEME_STORAGE_KEY = "stayverse.theme";
