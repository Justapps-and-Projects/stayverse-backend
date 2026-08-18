import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockIo } = vi.hoisted(() => {
  function createMockSocket() {
    const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
    const socket = {
      id: "sock-1",
      connected: false,
      on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event)!.add(cb);
      }),
      off: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
        listeners.get(event)?.delete(cb);
      }),
      emit: vi.fn(),
      disconnect: vi.fn(() => {
        socket.connected = false;
      }),
      removeAllListeners: vi.fn(() => listeners.clear()),
      _emitLocal(event: string, ...args: unknown[]) {
        listeners.get(event)?.forEach((cb) => cb(...args));
      },
      _connect() {
        socket.connected = true;
        listeners.get("connect")?.forEach((cb) => cb());
      },
    };
    return socket;
  }

  const mockIo = vi.fn(() => {
    const s = createMockSocket();
    queueMicrotask(() => s._connect());
    return s;
  });

  return { mockIo };
});

type TestSocket = {
  emit: ReturnType<typeof vi.fn>;
  _emitLocal: (event: string, ...args: unknown[]) => void;
};

vi.mock("socket.io-client", () => ({
  io: mockIo,
}));

vi.mock("../config/env", () => ({
  getEnv: () => ({
    APP_ENV: "development",
    APP_TARGET: "user",
    API_BASE_URL: "https://stayverse-backend-lzlu.onrender.com",
    SOCKET_URL: "https://stayverse-backend-lzlu.onrender.com",
  }),
}));

vi.mock("../storage/secureStorage", () => {
  const memory = new Map<string, string>();
  return {
    secureStorage: {
      getItem: async (name: string) => memory.get(name) ?? null,
      setItem: async (name: string, value: string) => {
        memory.set(name, value);
      },
      removeItem: async (name: string) => {
        memory.delete(name);
      },
    },
  };
});

import { QueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/authStore";
import { queryKeys } from "../query/keys";
import { bindSocketQueryBridge } from "./bridge";
import { socketEmit, socketListen } from "./events";
import {
  __resetSocketLifecycleForTests,
  bindSocketLifecycle,
  connectSockets,
  disconnectSockets,
  getSocket,
  isSocketConnected,
} from "./socket";
import { useSocketStore } from "./socketStore";
import {
  BackgroundSocketEvents,
  ChatSocketEvents,
  MainSocketEvents,
} from "./types";

describe("realtime socket", () => {
  beforeEach(() => {
    __resetSocketLifecycleForTests();
    mockIo.mockClear();
    useSocketStore.setState({ status: "disconnected", lastError: null });
    useAuthStore.getState().logout();
    useAuthStore.setState({ isHydrated: true, isLoading: false });
  });

  it("connects user namespaces /ws and /ws/chat with Bearer + role query", async () => {
    connectSockets("tok-abc");
    expect(mockIo).toHaveBeenCalledTimes(2);

    const firstCall = mockIo.mock.calls[0];
    expect(String(firstCall[0])).toContain("/ws");
    expect(firstCall[1].query).toEqual({ role: "user" });
    expect(firstCall[1].extraHeaders.Authorization).toBe("Bearer tok-abc");
    expect(firstCall[1].auth).toEqual({ token: "tok-abc" });

    await Promise.resolve();
    expect(useSocketStore.getState().status).toBe("connected");
    expect(isSocketConnected("main")).toBe(true);
  });

  it("disconnects and clears sockets", async () => {
    connectSockets("tok");
    await Promise.resolve();
    disconnectSockets();
    expect(getSocket("main")).toBeNull();
    expect(useSocketStore.getState().status).toBe("disconnected");
  });

  it("bindSocketLifecycle connects on login and disconnects on logout", async () => {
    const unbind = bindSocketLifecycle(() => useAuthStore.getState());
    useAuthStore.getState().login({
      accessToken: "live-tok",
      user: {
        id: "1",
        email: "a@b.com",
        name: "A",
        isEmailVerified: true,
      },
    });
    await Promise.resolve();
    expect(mockIo).toHaveBeenCalled();
    expect(useSocketStore.getState().status).toBe("connected");

    useAuthStore.getState().logout();
    expect(getSocket("main")).toBeNull();
    unbind();
  });

  it("exports Flutter event name constants only", () => {
    expect(MainSocketEvents.driverLocation).toBe("rider.example.location");
    expect(BackgroundSocketEvents.driverLocation).toBe("driver.updateLocation");
    expect(BackgroundSocketEvents.updated).toBe("updated");
    expect(ChatSocketEvents.messageNew).toBe("message.new");
    expect(ChatSocketEvents.messageDeleted).toBe("message.deleted");
    expect(ChatSocketEvents.messageRead).toBe("message.read");
    expect(ChatSocketEvents.typingStart).toBe("typing.start");
    expect(ChatSocketEvents.typingStop).toBe("typing.stop");
  });

  it("bridges chat events into React Query cache", async () => {
    connectSockets("tok");
    await Promise.resolve();
    const qc = new QueryClient();
    qc.setQueryData(queryKeys.chatPing, { ok: true });
    const unbridge = bindSocketQueryBridge(qc);

    const chat = getSocket("chat") as TestSocket | null;
    chat?._emitLocal(ChatSocketEvents.messageNew, { id: "1" });
    expect(qc.getQueryState(queryKeys.chatPing)?.isInvalidated).toBe(true);

    unbridge();
  });

  it("socketEmit uses Flutter main event name", async () => {
    connectSockets("tok");
    await Promise.resolve();
    socketEmit.riderExampleLocation({ x: 1 });
    const main = getSocket("main") as TestSocket | null;
    expect(main?.emit).toHaveBeenCalledWith("rider.example.location", { x: 1 });
  });

  it("socketListen.onChatMessageNew registers Flutter event", async () => {
    connectSockets("tok");
    await Promise.resolve();
    const cb = vi.fn();
    const off = socketListen.onChatMessageNew(cb);
    const chat = getSocket("chat") as TestSocket | null;
    chat?._emitLocal("message.new", { text: "hi" });
    expect(cb).toHaveBeenCalledWith({ text: "hi" });
    off();
  });
});
