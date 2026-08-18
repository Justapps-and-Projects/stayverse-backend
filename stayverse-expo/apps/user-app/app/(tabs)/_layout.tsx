import { useEffect } from "react";
import { Redirect, Tabs, type Href } from "expo-router";
import {
  requestForegroundLocationPermission,
  useAuthStore,
} from "@stayverse/core";
import { AppIcon, useTheme } from "@stayverse/ui";

export default function TabsLayout() {
  const { colors } = useTheme();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Flutter dashboard requests location on enter (user app only).
  useEffect(() => {
    if (isAuthenticated) {
      void requestForegroundLocationPermission();
    }
  }, [isAuthenticated]);

  if (isHydrated && !isAuthenticated) {
    return <Redirect href={"/(auth)/login" as Href} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="discover" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="favourite"
        options={{
          title: "Favourite",
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="favourite" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="bookings" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="inbox" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: "Profile",
          tabBarLabel: "Me",
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="profile" size={size} color={String(color)} />
          ),
        }}
      />
    </Tabs>
  );
}
