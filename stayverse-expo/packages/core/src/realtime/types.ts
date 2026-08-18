/**
 * Socket.IO event names copied from Flutter — do not invent new names.
 *
 * User: MainSocketEvent, EventType (BrimChat)
 * Agent: MainSocketEvent, BackgroundSocketEvent + listen "updated"
 */

/** User main `/ws` + agent main `/` */
export const MainSocketEvents = {
  /** Flutter `MainSocketEvent.driverLocation` — defined, never emitted in app code */
  driverLocation: "rider.example.location",
} as const;

/** Agent `/background` */
export const BackgroundSocketEvents = {
  /** Flutter `BackgroundSocketEvent.driverLocation` — emit candidate, unused in app */
  driverLocation: "driver.updateLocation",
  /** Flutter `BackgroundSocketIO.listenForLocationUpdates` */
  updated: "updated",
} as const;

/** User `/ws/chat` — Flutter `EventType` */
export const ChatSocketEvents = {
  any: "*",
  typingStart: "typing.start",
  typingStop: "typing.stop",
  messageNew: "message.new",
  messageDeleted: "message.deleted",
  messageRead: "message.read",
} as const;

export type MainSocketEventName =
  (typeof MainSocketEvents)[keyof typeof MainSocketEvents];
export type BackgroundSocketEventName =
  (typeof BackgroundSocketEvents)[keyof typeof BackgroundSocketEvents];
export type ChatSocketEventName =
  (typeof ChatSocketEvents)[keyof typeof ChatSocketEvents];

export type SocketConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type LocationUpdatePayload = {
  lat: number;
  lng: number;
};
