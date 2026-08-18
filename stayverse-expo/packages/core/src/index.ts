/**
 * Shared core package — API clients, stores, hooks, types, utils.
 */
export const APP_NAME = "Stayverse" as const;

export type AppTarget = "user" | "agent";

export * from "./types/auth";
export * from "./stores/authStore";
export * from "./stores/dashboardStore";
export * from "./stores/homeStore";
export * from "./stores/searchStore";
export * from "./stores/mapStore";
export * from "./stores/bookingFormStore";
export * from "./stores/bookingsUiStore";
export * from "./stores/bookingSelectionStore";
export * from "./stores/chatUiStore";
export * from "./stores/profileUiStore";
export * from "./stores/walletUiStore";
export * from "./stores/apartmentAdvertStore";
export * from "./stores/rideAdvertStore";
export * from "./stores/chefFormStore";
export * from "./stores/selfieStore";
export * from "./stores/favouritesUiStore";
export * from "./stores/onboardingStore";
export { secureStorage } from "./storage/secureStorage";
export {
  mmkv,
  mmkvStorage,
  StorageKeys,
  isMmkvNative,
  type StorageKey,
} from "./storage/mmkv";

export * from "./config/env";
export * from "./api/errors";
export * from "./api/types";
export { getApiClient, resetApiClient } from "./api/client";
export * from "./api/endpoints";
export * from "./api/endpoints/auth";
export * from "./api/endpoints/health";
export * from "./api/endpoints/catalog";

export { createQueryClient, queryKeys } from "./query/client";
export { StayverseQueryProvider } from "./query/QueryProvider";
export { useHealthQuery } from "./hooks/useHealthQuery";
export * from "./hooks/useAuthMutations";
export * from "./hooks/useCatalogQueries";
export { useSocketConnection } from "./hooks/useSocketConnection";
export { usePushNotifications } from "./hooks/usePushNotifications";
export { SocketLifecycle } from "./realtime/SocketLifecycle";
export {
  connectSockets,
  disconnectSockets,
  getSocket,
  isSocketConnected,
  reconnectSocketsWithToken,
  bindSocketLifecycle,
} from "./realtime/socket";
export { useSocketStore } from "./realtime/socketStore";
export { socketEmit, socketListen } from "./realtime/events";
export { bindSocketQueryBridge } from "./realtime/bridge";
export * from "./realtime/types";

export {
  NotificationLifecycle,
} from "./notifications/NotificationLifecycle";
export {
  configurePushUi,
  isPushNativeAvailable,
  pushDeviceToken,
  requestPushPermission,
  startPushListeners,
} from "./notifications/push";
export {
  foregroundToastFromMessage,
  resolveNotificationHref,
} from "./notifications/routes";
export {
  AnalyticsEvents,
  isAnalyticsNativeAvailable,
  logEvent,
  logScreenView,
  setAnalyticsUserId,
} from "./analytics/analytics";

export {
  getStreamClient,
  getStreamUserId,
  connectStreamUser,
  disconnectStreamUser,
  addStreamPushDevice,
  createMessagingChannel,
  watchMessagingChannel,
  isStreamConnected,
} from "./chat/streamClient";
export { stayverseStreamTheme } from "./chat/theme";
export { ProposalMessageCard } from "./chat/ProposalMessageCard";
export { useStreamUiStore } from "./chat/streamUiStore";
export { useStreamChatConnect } from "./hooks/useStreamChatConnect";

export {
  DEFAULT_MAP_LOCATION,
  LAGOS_BIAS_CENTER,
  requestForegroundLocationPermission,
  requestBackgroundLocationPermission,
  isForegroundLocationGranted,
  getCurrentPosition,
  watchPosition,
  distanceBetweenMeters,
  coordsFromGeoJson,
  type StayverseCoords,
} from "./location/location";
export {
  autocompletePlaces,
  reverseGeocode,
  geocodeAddress,
  type PlaceSuggestion,
} from "./location/places";
export {
  startLiveLocationBroadcast,
  stopLiveLocationBroadcast,
  bindLiveLocationSocketListener,
} from "./location/liveLocation";
export { StayverseMap, DetailMapEmbed } from "./maps/StayverseMap";
export { SearchMapView } from "./maps/SearchMapView";
export { LocationMapPicker, type PickedLocation } from "./maps/LocationMapPicker";
export { PlacesAutocompleteField } from "./maps/PlacesAutocompleteField";

export {
  MediaConstraints,
  pickListingImages,
  pickProfileFromCamera,
  pickProfileFromGallery,
  prepareImageForUpload,
  SelfieCamera,
  StayverseWebView,
  TAWK_SUPPORT_URL,
  type PickedImage,
  type StayverseWebViewProps,
} from "./media";

export {
  addStayverseBreadcrumb,
  captureStayverseException,
  initStayverseSentry,
  isSentryAvailable,
  sentryEnvironmentTag,
  setStayverseSentryUser,
  wrapWithSentry,
  SentryNavigationBridge,
  SentryUserBridge,
} from "./sentry";

export { launchAgentStore, AGENT_ANDROID_BUNDLE_ID, AGENT_IOS_APP_STORE_ID } from "./utils/launchAgentStore";
export { formatNaira } from "./utils/formatMoney";
export { extractArea } from "./utils/locationPrivacy";

export {
  DevTestUserCredentials,
  normalizeNigerianPhone,
  validateAccountNumber,
  validateConfirmPassword,
  validateEmail,
  validateMoney,
  validateName,
  validateNin,
  validatePassword,
  validatePhoneNumber,
  validatePin,
} from "./validation/validators";
