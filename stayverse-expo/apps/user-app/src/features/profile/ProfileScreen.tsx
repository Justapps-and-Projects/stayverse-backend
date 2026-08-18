import { useCallback, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { Link, router, type Href } from "expo-router";
import {
  pickProfileFromCamera,
  pickProfileFromGallery,
  pushDeviceToken,
  useAuthStore,
  useProfileQuery,
  useUploadProfilePictureMutation,
  type KycStatus,
} from "@stayverse/core";
import {
  AppIcon,
  Button,
  Text,
  showToast,
  spacing,
  useTheme,
} from "@stayverse/ui";

const SUPPORT_CHAT_URL =
  "https://tawk.to/chat/68d1171589caa6192613d1f4/1j5oc4b5e";
const ABOUT_URL = "https://www.stayversepro.com/";

function kycBadge(status: KycStatus | null | undefined): {
  label: string;
  color: string;
} | null {
  if (!status) return null;
  if (status === "approved") return { label: "Approved", color: "#22C55E" };
  if (status === "pending") return { label: "Pending", color: "#F59E0B" };
  if (status === "in_review") return { label: "In Review", color: "#9CA3AF" };
  if (status === "declined") return { label: "Declined", color: "#EF4444" };
  return null;
}

function ProfileRow({
  title,
  onPress,
  trailing,
  badge,
}: {
  title: string;
  onPress?: () => void;
  trailing?: ReactNode;
  badge?: { label: string; color: string } | null;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={styles.row}
      accessibilityRole={onPress ? "button" : undefined}
    >
      <View style={styles.rowTitleWrap}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>
          {title}
        </Text>
        {badge ? (
          <View
            style={[styles.badge, { backgroundColor: `${badge.color}1A` }]}
          >
            <Text style={[styles.badgeText, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
        ) : null}
      </View>
      {trailing ?? (
        <Text style={[styles.chevron, { color: colors.muted }]}>›</Text>
      )}
    </Pressable>
  );
}

/** Flutter `ProfilePage` — Me tab. */
export function ProfileScreen() {
  const { colors } = useTheme();
  const profileQuery = useProfileQuery();
  const uploadMutation = useUploadProfilePictureMutation();

  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const notificationsEnabled = user?.notificationsEnabled ?? false;
  const [notifBusy, setNotifBusy] = useState(false);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

  const confirmLogout = useCallback(() => {
    Alert.alert("Log Out 🚨", "Are you sure you want logout?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/(auth)/login" as Href);
        },
      },
    ]);
  }, [logout]);

  const confirmDelete = useCallback(() => {
    Alert.alert(
      "Delete Account 🚨",
      "Are you sure you want delete?\nYou will be asked to input your password",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: () => router.push("/profile/delete" as Href),
        },
      ],
    );
  }, []);

  const onToggleNotifications = useCallback(
    async (enable: boolean) => {
      if (notifBusy || !user) return;
      setNotifBusy(true);
      const previous = user.notificationsEnabled ?? false;
      setUser({ ...user, notificationsEnabled: enable });
      try {
        const token = await pushDeviceToken({ enable });
        if (!token) {
          setUser({ ...user, notificationsEnabled: previous });
          showToast({
            type: "error",
            title: "Could not update notifications",
          });
        } else {
          void profileQuery.refetch();
        }
      } catch {
        setUser({ ...user, notificationsEnabled: previous });
        showToast({ type: "error", title: "Please Try Again" });
      } finally {
        setNotifBusy(false);
      }
    },
    [notifBusy, profileQuery, setUser, user],
  );

  const uploadAvatar = useCallback(
    async (pick: "camera" | "gallery") => {
      const image =
        pick === "camera"
          ? await pickProfileFromCamera()
          : await pickProfileFromGallery();
      if (!image) return;
      setLocalAvatarUri(image.uri);
      try {
        await uploadMutation.mutateAsync(image);
        setLocalAvatarUri(null);
        showToast({ type: "success", title: "Profile uploaded successfully" });
      } catch (e) {
        setLocalAvatarUri(null);
        showToast({
          type: "error",
          title: e instanceof Error ? e.message : "Please Try Again",
        });
      }
    },
    [uploadMutation],
  );

  const changeAvatar = useCallback(() => {
    Alert.alert("Profile photo", undefined, [
      {
        text: "Take a Picture",
        onPress: () => void uploadAvatar("camera"),
      },
      {
        text: "Pick from Gallery",
        onPress: () => void uploadAvatar("gallery"),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [uploadAvatar]);

  const avatarUri = localAvatarUri ?? user?.avatarUrl ?? null;
  const badge = kycBadge(user?.kycStatus);

  return (
    <ScrollView
      style={[styles.wrap, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Pressable
          onPress={changeAvatar}
          style={[
            styles.avatar,
            { backgroundColor: `${colors.primary}33` },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <AppIcon name="person" size={40} color={colors.primary} />
          )}
          {uploadMutation.isPending ? (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}
        </Pressable>
        <Text style={[styles.name, { color: colors.foreground }]}>
          {user?.name ?? ""}
        </Text>
        <Text style={[styles.email, { color: colors.muted }]}>
          {user?.email ?? ""}
        </Text>
      </View>

      <View style={styles.menu}>
        <ProfileRow
          title="Wallet"
          onPress={() => router.push("/wallet" as Href)}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <ProfileRow
          title="Notification"
          trailing={
            <Switch
              value={notificationsEnabled}
              disabled={notifBusy}
              onValueChange={(v) => void onToggleNotifications(v)}
              trackColor={{
                false: colors.border,
                true: `${colors.primary}4D`,
              }}
              thumbColor={
                notificationsEnabled ? colors.primary : colors.card
              }
            />
          }
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <ProfileRow
          title="Curated Messages"
          onPress={() => router.push("/(tabs)/inbox" as Href)}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <ProfileRow
          title="Change Password"
          onPress={() => router.push("/profile/change-password" as Href)}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <ProfileRow
          title="Chat Support"
          onPress={() => void Linking.openURL(SUPPORT_CHAT_URL)}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <ProfileRow
          title="About"
          onPress={() => void Linking.openURL(ABOUT_URL)}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <ProfileRow
          title="KYC"
          badge={badge}
          onPress={() => router.push("/profile/kyc" as Href)}
        />
      </View>

      <View style={styles.actions}>
        <Button label="Log Out" onPress={confirmLogout} />
        <Pressable
          onPress={confirmDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete Account"
        >
          <Text style={styles.delete}>Delete Account</Text>
        </Pressable>
      </View>

      {__DEV__ ? (
        <View style={styles.dev}>
          <Link href={"/dev/components" as Href} style={styles.devLink}>
            <Text variant="bodyBold" style={{ color: colors.primary }}>
              UI kitchen sink
            </Text>
          </Link>
          <Link href={"/dev/map" as Href} style={styles.devLink}>
            <Text variant="bodyBold" style={{ color: colors.primary }}>
              Maps
            </Text>
          </Link>
          <Link href={"/dev/media" as Href} style={styles.devLink}>
            <Text variant="bodyBold" style={{ color: colors.primary }}>
              Media
            </Text>
          </Link>
          <Link href={"/dev/sentry" as Href} style={styles.devLink}>
            <Text variant="bodyBold" style={{ color: colors.primary }}>
              Sentry
            </Text>
          </Link>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  content: {
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: 4,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
  },
  email: {
    fontSize: 13,
  },
  menu: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  rowTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "400",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  chevron: {
    fontSize: 22,
    marginLeft: spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.md,
    alignItems: "center",
  },
  delete: {
    color: "#EF4444",
    textDecorationLine: "underline",
    fontWeight: "400",
  },
  dev: {
    marginTop: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  devLink: {
    paddingVertical: 4,
  },
});
