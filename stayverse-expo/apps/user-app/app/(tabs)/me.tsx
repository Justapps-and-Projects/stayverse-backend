import { useLayoutEffect } from "react";
import { Pressable } from "react-native";
import { router, useNavigation, type Href } from "expo-router";
import { AppIcon, useTheme } from "@stayverse/ui";
import { ProfileScreen } from "../../src/features/profile/ProfileScreen";

export default function MeTab() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Profile",
      headerRight: () => (
        <Pressable
          onPress={() => router.push("/profile/edit" as Href)}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          style={{ paddingHorizontal: 16 }}
        >
          <AppIcon name="edit_outline" size={22} color={colors.foreground} />
        </Pressable>
      ),
    });
  }, [navigation, colors.foreground]);

  return <ProfileScreen />;
}
