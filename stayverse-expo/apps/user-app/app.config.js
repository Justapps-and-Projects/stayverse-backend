const path = require("path");
const fs = require("fs");

/**
 * Load root monorepo env file selected by APP_ENV (development|staging|production).
 * EAS build profiles set APP_ENV in eas.json.
 */
function loadEnvFile() {
  const appEnv = process.env.APP_ENV || "development";
  const root = path.resolve(__dirname, "../..");
  const candidates = [
    path.join(root, `.env.${appEnv}`),
    path.join(root, ".env"),
    path.join(__dirname, `.env.${appEnv}`),
    path.join(__dirname, ".env"),
  ];

  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
    break;
  }

  return appEnv;
}

const appEnv = loadEnvFile();

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  name: "Stayverse",
  slug: "stayverse-user",
  owner: "oyekunlesolomon",
  version: "2.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "stayverse",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.stayverse.app",
    buildNumber: "2",
    googleServicesFile: "./GoogleService-Info.plist",
    config: {
      googleMapsApiKey:
        process.env.EXPO_PUBLIC_GOOGLE_MAPS_SDK_KEY ||
        process.env.EXPO_PUBLIC_GOOGLE_API_KEY ||
        "",
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      UIBackgroundModes: ["remote-notification", "fetch"],
      NSLocationWhenInUseUsageDescription:
        "We need your location to determine which services are available in your region.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "We need your location to determine which services are available in your region.",
      NSCameraUsageDescription:
        "We need camera access to allow you to take and send images.",
      NSPhotoLibraryUsageDescription:
        "We need access to your photo library so you can upload product images and set a profile picture.",
      NSPhotoLibraryAddUsageDescription:
        "We need permission to save images to your photo library.",
      NSMicrophoneUsageDescription:
        "We need microphone access to let you record audio and make calls.",
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#FFFFFF",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    package: "com.stayversepro.app",
    versionCode: 2,
    googleServicesFile: "./google-services.json",
    predictiveBackGestureEnabled: false,
    config: {
      googleMaps: {
        apiKey:
          process.env.EXPO_PUBLIC_GOOGLE_MAPS_SDK_KEY ||
          process.env.EXPO_PUBLIC_GOOGLE_API_KEY ||
          "",
      },
    },
    permissions: [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "CAMERA",
      "READ_MEDIA_IMAGES",
      "READ_EXTERNAL_STORAGE",
    ],
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  plugins: [
    "expo-router",
    "expo-status-bar",
    "expo-secure-store",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "We need your location to determine which services are available in your region.",
        locationAlwaysAndWhenInUsePermission:
          "We need your location to determine which services are available in your region.",
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission:
          "We need camera access to allow you to take and send images.",
        microphonePermission:
          "We need microphone access to let you record audio and make calls.",
        recordAudioAndroid: false,
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "We need access to your photo library so you can upload product images and set a profile picture.",
        cameraPermission:
          "We need camera access to allow you to take and send images.",
      },
    ],
    "@sentry/react-native/expo",
    "@react-native-firebase/app",
    "@react-native-firebase/messaging",
    [
      "expo-build-properties",
      {
        ios: {
          useFrameworks: "static",
          forceStaticLinking: ["RNFBApp", "RNFBMessaging", "RNFBAnalytics"],
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: "adc643bc-17d9-4a4c-856b-6ac0043116df",
    },
    stayverse: {
      APP_ENV: appEnv,
      APP_TARGET: process.env.EXPO_PUBLIC_APP_TARGET || "user",
      API_BASE_URL:
        process.env.EXPO_PUBLIC_API_BASE_URL ||
        "https://stayverse-backend-lzlu.onrender.com",
      SOCKET_URL:
        process.env.EXPO_PUBLIC_SOCKET_URL ||
        process.env.EXPO_PUBLIC_API_BASE_URL ||
        "https://stayverse-backend-lzlu.onrender.com",
      GOOGLE_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_API_KEY || "",
      GET_STREAM_KEY: process.env.EXPO_PUBLIC_GET_STREAM_KEY || "",
      SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN || "",
    },
  },
});
