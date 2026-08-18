import { useCallback, useState } from "react";
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
  type ServiceType,
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

function firstListingRow(serviceType: ServiceType | null): {
  title: string;
  href?: Href;
} {
  switch (serviceType) {
    case "ride":
      return { title: "Listed Cars", href: "/listings/rides" as Href };
    case "chef":
      return { title: "View Profile" };
    case "apartment":
    default:
      return { title: "Listed Apartment", href: "/listings/apartments" as Href };
  }
}

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

/** Flutter agent Profile / Me. */
export default function MeTab() {
  const { colors } = useTheme();
  const profileQuery = useProfileQuery();
  const uploadMutation = useUploadProfilePictureMutation();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const serviceType = useAuthStore((s) => s.serviceType);
  const logout = useAuthStore((s) => s.logout);
  const first = firstListingRow(serviceType);
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
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <Pressable
        onPress={changeAvatar}
        style={[styles.avatar, { backgroundColor: `${colors.primary}33` }]}
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
      <Text muted>{user?.email ?? ""}</Text>

      <View style={styles.menu}>
        <Pressable
          style={styles.row}
          onPress={() => {
            if (first.href) router.push(first.href);
          }}
          disabled={!first.href}
        >
          <Text style={styles.rowTitle}>{first.title}</Text>
          <Text style={{ color: colors.muted }}>›</Text>
        </Pressable>
        <View style={styles.row}>
          <Text style={styles.rowTitle}>Notification</Text>
          <Switch
            value={notificationsEnabled}
            disabled={notifBusy}
            onValueChange={(v) => void onToggleNotifications(v)}
            trackColor={{
              false: colors.border,
              true: `${colors.primary}4D`,
            }}
            thumbColor={notificationsEnabled ? colors.primary : colors.card}
          />
        </View>
        <Pressable
          style={styles.row}
          onPress={() => router.push("/(tabs)/inbox" as Href)}
        >
          <Text style={styles.rowTitle}>Curated Messages</Text>
          <Text style={{ color: colors.muted }}>›</Text>
        </Pressable>
        <Pressable
          style={styles.row}
          onPress={() => router.push("/profile/change-password" as Href)}
        >
          <Text style={styles.rowTitle}>Password</Text>
          <Text style={{ color: colors.muted }}>›</Text>
        </Pressable>
        <Pressable
          style={styles.row}
          onPress={() => void Linking.openURL(SUPPORT_CHAT_URL)}
        >
          <Text style={styles.rowTitle}>Chat Support</Text>
          <Text style={{ color: colors.muted }}>›</Text>
        </Pressable>
        <Pressable
          style={styles.row}
          onPress={() => void Linking.openURL(ABOUT_URL)}
        >
          <Text style={styles.rowTitle}>About</Text>
          <Text style={{ color: colors.muted }}>›</Text>
        </Pressable>
        <Pressable
          style={styles.row}
          onPress={() => router.push("/profile/kyc" as Href)}
        >
          <View style={styles.kycRow}>
            <Text style={styles.rowTitle}>KYC</Text>
            {badge ? (
              <View
                style={[styles.badge, { backgroundColor: `${badge.color}1A` }]}
              >
                <Text style={{ color: badge.color, fontSize: 11 }}>
                  {badge.label}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={{ color: colors.muted }}>›</Text>
        </Pressable>
      </View>

      <Button label="Log Out" variant="dark" onPress={confirmLogout} />
      <Pressable onPress={confirmDelete} accessibilityRole="button">
        <Text style={styles.delete}>Delete Account</Text>
      </Pressable>

      {__DEV__ ? (
        <View style={styles.dev}>
          <Link href={"/map" as Href}>
            <Text variant="bodyBold" style={{ color: colors.primary }}>
              Location tools
            </Text>
          </Link>
          <Link href={"/media" as Href}>
            <Text variant="bodyBold" style={{ color: colors.primary }}>
              Media tools
            </Text>
          </Link>
          <Link href={"/sentry" as Href}>
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
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: "center",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginTop: spacing.md,
  },
  avatarImage: { width: "100%", height: "100%" },
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
  menu: {
    alignSelf: "stretch",
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5E5",
  },
  rowTitle: { fontSize: 15 },
  kycRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  delete: {
    color: "#EF4444",
    textDecorationLine: "underline",
    fontWeight: "400",
    marginTop: spacing.sm,
  },
  dev: {
    marginTop: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
});
