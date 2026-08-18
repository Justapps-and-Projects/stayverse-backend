import { Stack } from "expo-router";
import { useTheme } from "@stayverse/ui";

export default function AuthLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ title: "" }} />
      <Stack.Screen name="signup" options={{ title: "Sign up" }} />
      <Stack.Screen name="verify-otp" options={{ title: "" }} />
      <Stack.Screen name="forgot-password" options={{ title: "" }} />
      <Stack.Screen name="reset-password" options={{ title: "" }} />
    </Stack>
  );
}
