import type { StayverseEnv } from "../config/env";

export type NotificationData = Record<string, string | undefined>;

type AppTarget = StayverseEnv["APP_TARGET"];

/**
 * Map FCM `data` → Expo Router href.
 * Flutter tap handlers existed but were never wired — these routes are greenfield
 * using existing tab shells + backend payload keys.
 */
export function resolveNotificationHref(
  data: NotificationData,
  target: AppTarget,
): string | null {
  const type = data.type;

  if (type === "curated_message") {
    return "/(tabs)/inbox";
  }

  // Stream Chat push payloads (channel_id / cid)
  const streamCid =
    data.cid ||
    (data.channel_type && data.channel_id
      ? `${data.channel_type}:${data.channel_id}`
      : null);
  if (streamCid) {
    return `/chat/${encodeURIComponent(streamCid)}`;
  }

  if (data.bookingId) {
    return target === "user" ? "/(tabs)/bookings" : "/(tabs)/inbox";
  }

  if (data.proposalId) {
    return target === "user" ? "/(tabs)/bookings" : "/(tabs)/inbox";
  }

  if (data.escrowId) {
    return target === "agent" ? "/(tabs)/wallet" : "/(tabs)/bookings";
  }

  if (data.chefId || data.rideId || data.apartmentId) {
    return target === "agent" ? "/(tabs)/index" : "/(tabs)/index";
  }

  return null;
}

export type ForegroundToastPayload = {
  title: string;
  message: string;
};

/** Mirrors Flutter `NotificationMessageHandler.handleForegroundMessage`. */
export function foregroundToastFromMessage(input: {
  title?: string | null;
  body?: string | null;
  data?: NotificationData;
}): ForegroundToastPayload | null {
  const title = input.title?.trim() ?? "";
  const body = input.body?.trim() ?? "";
  if (!title && !body) return null;

  if (input.data?.type === "curated_message") {
    return {
      title: title || "Curated Message",
      message: body || "You have a new curated message.",
    };
  }

  return {
    title: title || "Notification",
    message: body || "You have a new notification.",
  };
}
