import "../global.css";
import "react-native-gesture-handler";

import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { StyleSheet, View } from "react-native";
import { colorScheme } from "nativewind";
import { neueMontrealFonts } from "@stayverse/assets";
import {
  initStayverseSentry,
  SentryNavigationBridge,
  SentryUserBridge,
  SocketLifecycle,
  StayverseQueryProvider,
  wrapWithSentry,
} from "@stayverse/core";
import { ThemeProvider, ToastHost, StayverseLoader } from "@stayverse/ui";
import { FirebaseBootstrap } from "../src/FirebaseBootstrap";
import { StreamChatProvider } from "../src/StreamChatProvider";

initStayverseSentry();

const FONT_BOOT_TIMEOUT_MS = 4000;

function RootLayout() {
  const [loaded, fontError] = useFonts(neueMontrealFonts);
  const [fontTimedOut, setFontTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFontTimedOut(true), FONT_BOOT_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  // Never block the app forever if a font asset fails to load in release builds.
  if (!loaded && !fontError && !fontTimedOut) {
    return (
      <View style={styles.boot}>
        <StayverseLoader color="#2C2C2C" size={64} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <StayverseQueryProvider>
        <SocketLifecycle />
        <SentryUserBridge />
        <FirebaseBootstrap />
        <ThemeProvider onSchemeChange={(scheme) => colorScheme.set(scheme)}>
          <StreamChatProvider>
            <BottomSheetModalProvider>
              <StatusBar style="auto" />
              <SentryNavigationBridge />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="listings/apartments"
                  options={{ headerShown: true, title: "Apartments" }}
                />
                <Stack.Screen
                  name="listings/rides"
                  options={{ headerShown: true, title: "Cars" }}
                />
                <Stack.Screen
                  name="listings/create-apartment"
                  options={{ headerShown: true, title: "New Advert" }}
                />
                <Stack.Screen
                  name="listings/create-ride"
                  options={{ headerShown: true, title: "Add Vehicle" }}
                />
                <Stack.Screen
                  name="listings/create-chef"
                  options={{ headerShown: true, title: "Chef Profile" }}
                />
                <Stack.Screen
                  name="booking/[id]"
                  options={{ headerShown: true, title: "Details" }}
                />
                <Stack.Screen
                  name="wallet/index"
                  options={{ headerShown: true, title: "Wallet" }}
                />
                <Stack.Screen
                  name="wallet/withdraw"
                  options={{ headerShown: true, title: "Withdraw" }}
                />
                <Stack.Screen
                  name="wallet/withdraw-success"
                  options={{ headerShown: true, title: "Withdraw Successful" }}
                />
                <Stack.Screen
                  name="profile/edit"
                  options={{ headerShown: true, title: "Edit Profile" }}
                />
                <Stack.Screen
                  name="profile/change-password"
                  options={{ headerShown: true, title: "Change Password" }}
                />
                <Stack.Screen
                  name="profile/kyc"
                  options={{ headerShown: true, title: "KYC Verification" }}
                />
                <Stack.Screen
                  name="profile/delete"
                  options={{ headerShown: true, title: "Delete Account" }}
                />
                <Stack.Screen
                  name="chat/[cid]"
                  options={{ headerShown: true, title: "Chat" }}
                />
                <Stack.Screen
                  name="map/index"
                  options={{ headerShown: true, title: "Location" }}
                />
                <Stack.Screen
                  name="media"
                  options={{ headerShown: true, title: "Media" }}
                />
                <Stack.Screen
                  name="sentry"
                  options={{ headerShown: true, title: "Sentry" }}
                />
              </Stack>
              <ToastHost />
            </BottomSheetModalProvider>
          </StreamChatProvider>
        </ThemeProvider>
      </StayverseQueryProvider>
    </GestureHandlerRootView>
  );
}

export default wrapWithSentry(RootLayout);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  boot: { flex: 1, alignItems: "center", justifyContent: "center" },
});
