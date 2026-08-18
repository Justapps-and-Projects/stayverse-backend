import { io, type Socket } from "socket.io-client";
import { getEnv } from "../config/env";
import { useAuthStore } from "../stores/authStore";
import { addStayverseBreadcrumb } from "../sentry/sentry";
import { useSocketStore } from "./socketStore";

export type SocketNamespaceKey = "main" | "chat" | "background";

/**
 * Flutter namespaces:
 * - user main: `/ws`, user chat: `/ws/chat`
 * - agent main: `/`, agent background: `/background`
 */
function namespacesForTarget(target: "user" | "agent"): Record<SocketNamespaceKey, string | null> {
  if (target === "agent") {
    return { main: "/", chat: null, background: "/background" };
  }
  return { main: "/ws", chat: "/ws/chat", background: null };
}

function socketUrl(base: string, namespace: string): string {
  const root = base.replace(/\/$/, "");
  if (namespace === "/" || namespace === "") return root;
  return `${root}${namespace.startsWith("/") ? namespace : `/${namespace}`}`;
}

const sockets = new Map<SocketNamespaceKey, Socket>();
let boundToken: string | null = null;
let lifecycleBound = false;

function log(...args: unknown[]) {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log("[socket]", ...args);
  }
}

function attachLifecycle(socket: Socket, key: SocketNamespaceKey) {
  socket.on("connect", () => {
    log(key, "connected", socket.id);
    useSocketStore.getState().setStatus("connected");
  });
  socket.on("disconnect", (reason) => {
    log(key, "disconnect", reason);
    addStayverseBreadcrumb(`Socket ${key} disconnect`, "socket", {
      namespace: key,
      reason: String(reason),
    }, "warning");
    const anyConnected = [...sockets.values()].some((s) => s.connected);
    if (!anyConnected) {
      useSocketStore.getState().setStatus("disconnected");
    }
  });
  socket.on("connect_error", (err) => {
    log(key, "connect_error", err.message);
    addStayverseBreadcrumb(`Socket ${key} connect_error`, "socket", {
      namespace: key,
      message: err.message,
    }, "error");
    useSocketStore.getState().setStatus("error", err.message);
  });
}

/**
 * Auth matches Flutter `BaseSocketIO.connect`:
 * - query: `{ role: "user" | "agent" }`
 * - extraHeaders: `{ Authorization: "Bearer <token>" }`
 * (Flutter did not use the Socket.IO `auth` option.)
 */
function createSocket(namespace: string, token: string, role: "user" | "agent"): Socket {
  const env = getEnv();
  const base = env.SOCKET_URL ?? env.API_BASE_URL;
  const url = socketUrl(base, namespace);

  return io(url, {
    transports: ["websocket"],
    autoConnect: true,
    query: { role },
    extraHeaders: {
      Authorization: `Bearer ${token}`,
    },
    // RN WebSocket often drops custom headers; mirror token for engines that read handshake auth.
    auth: { token },
  });
}

export function getSocket(key: SocketNamespaceKey): Socket | null {
  return sockets.get(key) ?? null;
}

export function isSocketConnected(key: SocketNamespaceKey = "main"): boolean {
  return sockets.get(key)?.connected === true;
}

export function connectSockets(accessToken: string): void {
  if (!accessToken) {
    log("skip connect — no token");
    return;
  }

  if (boundToken === accessToken && [...sockets.values()].some((s) => s.connected)) {
    log("already connected with same token");
    return;
  }

  disconnectSockets();
  boundToken = accessToken;

  const env = getEnv();
  const role = env.APP_TARGET;
  const map = namespacesForTarget(role);

  useSocketStore.getState().setStatus("connecting");

  (Object.entries(map) as [SocketNamespaceKey, string | null][]).forEach(([key, ns]) => {
    if (!ns) return;
    const socket = createSocket(ns, accessToken, role);
    attachLifecycle(socket, key);
    sockets.set(key, socket);
    log("connecting", key, ns);
  });
}

export function disconnectSockets(): void {
  for (const [key, socket] of sockets) {
    log("disconnect", key);
    socket.removeAllListeners();
    socket.disconnect();
  }
  sockets.clear();
  boundToken = null;
  useSocketStore.getState().setStatus("disconnected");
}

/** Reconnect after local token overwrite (`refreshToken`). */
export function reconnectSocketsWithToken(accessToken: string): void {
  connectSockets(accessToken);
}

/**
 * Subscribe once to authStore — connect on login, disconnect on logout,
 * reconnect when accessToken changes while authenticated.
 */
export function bindSocketLifecycle(getAuth: () => {
  isAuthenticated: boolean;
  accessToken: string | null;
  isHydrated: boolean;
}): () => void {
  if (lifecycleBound) {
    return () => undefined;
  }
  lifecycleBound = true;

  const sync = () => {
    const { isAuthenticated, accessToken, isHydrated } = getAuth();
    if (!isHydrated) return;
    if (isAuthenticated && accessToken) {
      if (boundToken !== accessToken) {
        connectSockets(accessToken);
      }
    } else {
      disconnectSockets();
    }
  };

  sync();
  const unsub = useAuthStore.subscribe(sync);
  return () => {
    unsub();
    lifecycleBound = false;
    disconnectSockets();
  };
}

/** Vitest only — clears singleton flags between cases. */
export function __resetSocketLifecycleForTests(): void {
  lifecycleBound = false;
  disconnectSockets();
}
