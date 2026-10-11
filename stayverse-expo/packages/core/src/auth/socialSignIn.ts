import { Platform } from "react-native";
import { getEnv } from "../config/env";

const GOOGLE_IOS_CLIENT_ID =
  "576811326554-1b6ki3t03p7sdcl56gjbtgrcqips7sl7.apps.googleusercontent.com";
const GOOGLE_WEB_CLIENT_ID =
  "576811326554-t11hkabu4d5oog1vf8ce8renubj219qn.apps.googleusercontent.com";
const GOOGLE_IOS_REDIRECT =
  "com.googleusercontent.apps.576811326554-1b6ki3t03p7sdcl56gjbtgrcqips7sl7:/oauthredirect";

export class SocialSignInCancelled extends Error {
  readonly code = "SOCIAL_CANCELLED";

  constructor() {
    super("Sign-in cancelled");
    this.name = "SocialSignInCancelled";
  }
}

export function isSocialSignInCancelled(error: unknown): boolean {
  return error instanceof SocialSignInCancelled;
}

type AppleModule = {
  isAvailableAsync: () => Promise<boolean>;
  signInAsync: (options: {
    requestedScopes: string[];
  }) => Promise<{
    identityToken: string | null;
    fullName?: {
      givenName?: string | null;
      familyName?: string | null;
    } | null;
  }>;
  AppleAuthenticationScope: { FULL_NAME: string; EMAIL: string };
};

type AuthSessionModule = {
  AuthRequest: new (options: Record<string, unknown>) => {
    promptAsync: (
      discovery: { authorizationEndpoint: string },
    ) => Promise<{
      type: string;
      params: Record<string, string>;
      authentication?: { idToken?: string | null } | null;
    }>;
  };
  makeRedirectUri: (options: { scheme: string; path?: string }) => string;
  ResponseType: { IdToken: string };
};

export type NativeSocialCredential = {
  idToken: string;
  firstname?: string;
  lastname?: string;
};

function loadAuthSession(): AuthSessionModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AuthSession = require("expo-auth-session") as AuthSessionModule;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const WebBrowser = require("expo-web-browser") as {
    maybeCompleteAuthSession?: () => void;
  };
  WebBrowser.maybeCompleteAuthSession?.();
  return AuthSession;
}

/** Opens Google and returns an ID token for POST /auth/social. */
export async function promptGoogleIdToken(): Promise<NativeSocialCredential> {
  const AuthSession = loadAuthSession();
  const userAppOnIos =
    Platform.OS === "ios" && getEnv().APP_TARGET !== "agent";
  const clientId = userAppOnIos ? GOOGLE_IOS_CLIENT_ID : GOOGLE_WEB_CLIENT_ID;
  const redirectUri = userAppOnIos
    ? GOOGLE_IOS_REDIRECT
    : AuthSession.makeRedirectUri({
        scheme: getEnv().APP_TARGET === "agent" ? "stayverse-agent" : "stayverse",
        path: "oauthredirect",
      });

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes: ["openid", "profile", "email"],
    responseType: AuthSession.ResponseType.IdToken,
    usePKCE: false,
    extraParams: { nonce: `${Date.now()}` },
  });

  const result = await request.promptAsync({
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  });

  if (result.type === "cancel" || result.type === "dismiss") {
    throw new SocialSignInCancelled();
  }
  if (result.type !== "success") {
    throw new Error("Google sign-in did not complete. Try again.");
  }

  const idToken = result.params.id_token || result.authentication?.idToken || "";
  if (!idToken) {
    throw new Error("Google did not return a sign-in token.");
  }
  return { idToken };
}

/** Native Sign in with Apple. iPhone only. */
export async function promptAppleIdToken(): Promise<NativeSocialCredential> {
  if (Platform.OS !== "ios") {
    throw new Error("Sign in with Apple is available on iPhone.");
  }

  let Apple: AppleModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Apple = require("expo-apple-authentication") as AppleModule;
  } catch {
    throw new Error("Sign in with Apple is not available in this build.");
  }

  const available = await Apple.isAvailableAsync();
  if (!available) {
    throw new Error("Sign in with Apple is not available on this device.");
  }

  try {
    const credential = await Apple.signInAsync({
      requestedScopes: [
        Apple.AppleAuthenticationScope.FULL_NAME,
        Apple.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      throw new Error("Apple did not return a sign-in token.");
    }
    return {
      idToken: credential.identityToken,
      firstname: credential.fullName?.givenName ?? undefined,
      lastname: credential.fullName?.familyName ?? undefined,
    };
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code)
        : "";
    if (code === "ERR_REQUEST_CANCELED") throw new SocialSignInCancelled();
    throw error;
  }
}
