import type { Socket } from "socket.io-client";
import { getSocket, type SocketNamespaceKey } from "./socket";
import {
  BackgroundSocketEvents,
  ChatSocketEvents,
  MainSocketEvents,
  type LocationUpdatePayload,
} from "./types";

type Listener = (data: unknown) => void;

function requireSocket(key: SocketNamespaceKey): Socket | null {
  return getSocket(key);
}

/** Emit helpers — Flutter defined these; call sites were unused. */
export const socketEmit = {
  /** Flutter `MainSocketEvent.driverLocation` */
  riderExampleLocation(data: unknown) {
    requireSocket("main")?.emit(MainSocketEvents.driverLocation, data);
  },
  /** Flutter `BackgroundSocketEvent.driverLocation` (agent) */
  driverUpdateLocation(data: { lat: number; lng: number } | unknown) {
    requireSocket("background")?.emit(BackgroundSocketEvents.driverLocation, data);
  },
};

/** Listen helpers matching Flutter registration. */
export const socketListen = {
  onMain(event: string, callback: Listener) {
    const s = requireSocket("main");
    s?.on(event, callback);
    return () => {
      s?.off(event, callback);
    };
  },
  onChat(event: string, callback: Listener) {
    const s = requireSocket("chat");
    s?.on(event, callback);
    return () => {
      s?.off(event, callback);
    };
  },
  /** Flutter `BackgroundSocketIO.listenForLocationUpdates` → event `updated` */
  onLocationUpdated(callback: (payload: LocationUpdatePayload) => void) {
    const s = requireSocket("background");
    const handler = (data: unknown) => {
      const d = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
      const lat = Number(d.lat);
      const lng = Number(d.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        callback({ lat, lng });
      }
    };
    s?.on(BackgroundSocketEvents.updated, handler);
    return () => {
      s?.off(BackgroundSocketEvents.updated, handler);
    };
  },
  onChatMessageNew(callback: Listener) {
    return socketListen.onChat(ChatSocketEvents.messageNew, callback);
  },
  onChatMessageDeleted(callback: Listener) {
    return socketListen.onChat(ChatSocketEvents.messageDeleted, callback);
  },
  onChatTypingStart(callback: Listener) {
    return socketListen.onChat(ChatSocketEvents.typingStart, callback);
  },
  onChatTypingStop(callback: Listener) {
    return socketListen.onChat(ChatSocketEvents.typingStop, callback);
  },
  onChatMessageRead(callback: Listener) {
    return socketListen.onChat(ChatSocketEvents.messageRead, callback);
  },
};

export { MainSocketEvents, BackgroundSocketEvents, ChatSocketEvents };
