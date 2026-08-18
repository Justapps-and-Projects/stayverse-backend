import { Redirect, Tabs, type Href } from "expo-router";
import { useAuthStore, type ServiceType } from "@stayverse/core";
import { AppIcon, useTheme } from "@stayverse/ui";

function middleTabLabel(serviceType: ServiceType | null): string {
  switch (serviceType) {
    case "chef":
      return "Add Dish";
    case "ride":
      return "Add Vehicle";
    case "apartment":
    default:
      return "Add Property";
  }
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const serviceType = useAuthStore((s) => s.serviceType);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addLabel = middleTabLabel(serviceType);

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
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="wallet" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: addLabel,
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="add" size={size} color={String(color)} />
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
          title: "Me",
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="profile" size={size} color={String(color)} />
          ),
        }}
      />
    </Tabs>
  );
}
