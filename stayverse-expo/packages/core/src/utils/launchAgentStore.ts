import { Linking, Platform } from "react-native";

/** Flutter `Constant` — agent app store IDs (user app Host CTA). */
export const AGENT_ANDROID_BUNDLE_ID = "com.stayverse.agent.app";
export const AGENT_IOS_APP_STORE_ID = "6751253554";

/**
 * Flutter `launchStore()` — opens Stayverse Agent listing.
 */
export async function launchAgentStore(): Promise<void> {
  const url =
    Platform.OS === "ios"
      ? `https://apps.apple.com/app/id${AGENT_IOS_APP_STORE_ID}`
      : `https://play.google.com/store/apps/details?id=${AGENT_ANDROID_BUNDLE_ID}`;
  const can = await Linking.canOpenURL(url);
  if (can) {
    await Linking.openURL(url);
  }
}
