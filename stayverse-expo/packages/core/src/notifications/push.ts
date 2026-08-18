import { Platform } from "react-native";
import { getEnv } from "../config/env";
import { addStreamPushDevice } from "../chat/streamClient";
import { registerDeviceToken } from "../api/endpoints/notifications";
import { mmkv, StorageKeys } from "../storage/mmkv";
import { useAuthStore } from "../stores/authStore";
import {
  foregroundToastFromMessage,
  resolveNotificationHref,
  type ForegroundToastPayload,
  type NotificationData,
} from "./routes";

type MessagingModule = typeof import("@react-native-firebase/messaging").default;
type RemoteMessage = import("@react-native-firebase/messaging").FirebaseMessagingTypes.RemoteMessage;

export type PushUiHandlers = {
  showToast?: (payload: ForegroundToastPayload) => void;
  navigate?: (href: string) => void;
};

let messagingMod: MessagingModule | null | undefined;
let handlers: PushUiHandlers = {};
let started = false;
let unsubscribers: Array<() => void> = [];

function log(...args: unknown[]) {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log("[push]", ...args);
  }
}

function getMessaging(): MessagingModule | null {
  if (messagingMod !== undefined) return messagingMod;
  try {
    // Native-only — unavailable in Expo Go / web / tests without mock.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    messagingMod = require("@react-native-firebase/messaging").default as MessagingModule;
    return messagingMod;
  } catch (e) {
    log("messaging unavailable", e);
    messagingMod = null;
    return null;
  }
}

export function isPushNativeAvailable(): boolean {
  return getMessaging() !== null;
}

export function configurePushUi(next: PushUiHandlers): void {
  handlers = { ...handlers, ...next };
}

function dataFromMessage(message: RemoteMessage): NotificationData {
  const raw = message.data ?? {};
  const out: NotificationData = {};
  for (const [k, v] of Object.entries(raw)) {
    out[k] = v == null ? undefined : String(v);
  }
  return out;
}

async function getFcmToken(): Promise<string | null> {
  const messaging = getMessaging();
  if (!messaging) return null;

  try {
    if (Platform.OS === "ios") {
      let apns = await messaging().getAPNSToken();
      if (!apns) {
        await new Promise((r) => setTimeout(r, 3000));
        apns = await messaging().getAPNSToken();
      }
      if (!apns) {
        log("no APNs token yet");
        return null;
      }
    }
    const token = await messaging().getToken();
    return token || null;
  } catch (e) {
    log("getToken failed", e);
    return null;
  }
}

export async function requestPushPermission(): Promise<boolean> {
  const messaging = getMessaging();
  if (!messaging) return false;

  const auth = await messaging().requestPermission({
    alert: true,
    announcement: true,
    badge: true,
    carPlay: true,
    criticalAlert: false,
    provisional: false,
    sound: true,
  });

  const enabled =
    auth === messaging.AuthorizationStatus.AUTHORIZED ||
    auth === messaging.AuthorizationStatus.PROVISIONAL;

  // iOS foreground display — call if present (API varies by RNFB major).
  const withPresentation = messaging() as {
    setForegroundNotificationPresentationOptions?: (opts: {
      alert: boolean;
      badge: boolean;
      sound: boolean;
    }) => Promise<void>;
  };
  if (Platform.OS === "ios" && withPresentation.setForegroundNotificationPresentationOptions) {
    await withPresentation.setForegroundNotificationPresentationOptions({
      alert: true,
      badge: true,
      sound: true,
    });
  }

  return enabled;
}

/**
 * Flutter `BrimPusher.pushToken` — PATCH device token + persist locally.
 */
export async function pushDeviceToken(options?: {
  enable?: boolean;
}): Promise<string | null> {
  const token = await getFcmToken();
  if (!token) return null;

  const user = useAuthStore.getState().user as
    | { notificationsEnabled?: boolean | null }
    | null
    | undefined;
  const enable =
    options?.enable ?? user?.notificationsEnabled ?? true;

  try {
    await registerDeviceToken({ deviceToken: token, enable });
    mmkv.setString(StorageKeys.deviceToken, token);
    // Flutter StreamClientService.pushToken — same FCM token, provider Stayverse
    await addStreamPushDevice(token);
    log("registered device token");
    return token;
  } catch (e) {
    log("registerDeviceToken failed", e);
    return null;
  }
}

function handleOpen(message: RemoteMessage | null) {
  if (!message) return;
  const href = resolveNotificationHref(
    dataFromMessage(message),
    getEnv().APP_TARGET,
  );
  if (href) {
    handlers.navigate?.(href);
  }
}

function handleForeground(message: RemoteMessage) {
  const toast = foregroundToastFromMessage({
    title: message.notification?.title,
    body: message.notification?.body,
    data: dataFromMessage(message),
  });
  if (toast) handlers.showToast?.(toast);
}

/**
 * Start permission + listeners. Safe to call once from root layout.
 * No-ops when native Firebase Messaging is missing (Expo Go).
 */
export async function startPushListeners(): Promise<() => void> {
  if (started) {
    return () => undefined;
  }

  const messaging = getMessaging();
  if (!messaging) {
    return () => undefined;
  }

  started = true;
  await requestPushPermission();

  unsubscribers.push(
    messaging().onMessage(async (message) => {
      handleForeground(message);
    }),
  );

  unsubscribers.push(
    messaging().onNotificationOpenedApp((message) => {
      handleOpen(message);
    }),
  );

  unsubscribers.push(
    messaging().onTokenRefresh(() => {
      const { isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated) {
        void pushDeviceToken();
      }
    }),
  );

  const initial = await messaging().getInitialNotification();
  handleOpen(initial);

  return () => {
    unsubscribers.forEach((u) => u());
    unsubscribers = [];
    started = false;
  };
}

/** Vitest helper */
export function __resetPushForTests(): void {
  started = false;
  unsubscribers = [];
  handlers = {};
  messagingMod = undefined;
}
