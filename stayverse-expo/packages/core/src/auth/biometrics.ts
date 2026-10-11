import { mmkv, StorageKeys } from "../storage/mmkv";

type LocalAuthModule = {
  hasHardwareAsync: () => Promise<boolean>;
  isEnrolledAsync: () => Promise<boolean>;
  authenticateAsync: (options: {
    promptMessage: string;
    cancelLabel?: string;
    disableDeviceFallback?: boolean;
  }) => Promise<{ success: boolean }>;
};

function loadLocalAuth(): LocalAuthModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-local-authentication") as LocalAuthModule;
  } catch {
    return null;
  }
}

export function isBiometricUnlockEnabled(): boolean {
  return mmkv.getBoolean(StorageKeys.biometrics) === true;
}

export function setBiometricUnlockEnabled(enabled: boolean): void {
  mmkv.setBoolean(StorageKeys.biometrics, enabled);
}

/**
 * Confirms the device has Face ID or a fingerprint and prompts once.
 * Returns a user-facing message when the toggle should stay off.
 */
export async function enableBiometricUnlock(): Promise<string | null> {
  const localAuth = loadLocalAuth();
  if (!localAuth) {
    return "Face ID is not available in this build.";
  }

  const hasHardware = await localAuth.hasHardwareAsync();
  const enrolled = hasHardware ? await localAuth.isEnrolledAsync() : false;
  if (!hasHardware || !enrolled) {
    return "Set up Face ID or fingerprint in your device settings first.";
  }

  const result = await localAuth.authenticateAsync({
    promptMessage: "Enable Face ID for Stayverse",
    cancelLabel: "Cancel",
    disableDeviceFallback: false,
  });

  if (!result.success) return "Face ID was not confirmed.";
  setBiometricUnlockEnabled(true);
  return null;
}
