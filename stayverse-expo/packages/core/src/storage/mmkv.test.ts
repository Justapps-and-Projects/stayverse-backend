import { describe, expect, it, vi } from "vitest";

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

import { mmkv, StorageKeys } from "./mmkv";

describe("mmkv storage", () => {
  it("round-trips strings and json", () => {
    mmkv.setString("k", "v");
    expect(mmkv.getString("k")).toBe("v");
    mmkv.setJson("obj", { a: 1 });
    expect(mmkv.getJson<{ a: number }>("obj")).toEqual({ a: 1 });
    mmkv.remove("k");
    expect(mmkv.getString("k")).toBeNull();
  });

  it("does not define sensitive auth keys in StorageKeys", () => {
    const values = Object.values(StorageKeys);
    expect(values).not.toContain("token.key");
    expect(values).not.toContain("chat.token.key");
    expect(values).not.toContain("auth.user.key");
    expect(values).not.toContain("stayverse-auth");
  });
});
