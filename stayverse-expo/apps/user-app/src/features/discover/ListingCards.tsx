import { Image, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { router, type Href } from "expo-router";
import { shortletPng } from "@stayverse/assets";
import type { ListingSummary } from "@stayverse/core";
import { formatNaira } from "@stayverse/core";
import { AppIcon, Text, spacing, useTheme } from "@stayverse/ui";

type Props = {
  item: ListingSummary;
  /** Stretch to parent (favourites 2-col grid). */
  stretch?: boolean;
  style?: StyleProp<ViewStyle>;
};

function ListingImage({
  uri,
  stretch,
}: {
  uri?: string | null;
  stretch?: boolean;
}) {
  const imageStyle = stretch ? styles.imageStretch : styles.image;
  if (uri) {
    return <Image source={{ uri }} style={imageStyle} resizeMode="cover" />;
  }
  return <Image source={shortletPng} style={imageStyle} resizeMode="cover" />;
}

/** Flutter apartment / ride card (home feed, no favourite). */
export function ServiceListingCard({ item, stretch, style }: Props) {
  const { colors } = useTheme();

  const openDetails = () => {
    router.push(`/listing/${item.kind}/${item.id}` as Href);
  };

  return (
    <Pressable
      onPress={openDetails}
      style={[
        styles.card,
        stretch && styles.cardStretch,
        { backgroundColor: colors.card },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <ListingImage uri={item.imageUrl} stretch={stretch} />
      <View style={styles.body}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.foreground }]}>
          {item.title}
        </Text>
        <View style={styles.locationRow}>
          <AppIcon name="location" size={16} color={colors.muted} />
          <Text numberOfLines={1} style={[styles.subtitle, { color: colors.muted }]}>
            {item.subtitle}
          </Text>
        </View>
        <Text style={[styles.price, { color: colors.foreground }]}>
          {formatNaira(item.price ?? 0, 0)}
          <Text style={[styles.suffix, { color: colors.muted }]}>
            {item.priceSuffix ?? ""}
          </Text>
        </Text>
      </View>
    </Pressable>
  );
}

/** Flutter `ChefsCard` (home recommendations). */
export function ChefListingCard({ item, stretch, style }: Props) {
  const { colors } = useTheme();

  const openDetails = () => {
    router.push(`/listing/${item.kind}/${item.id}` as Href);
  };

  return (
    <Pressable
      onPress={openDetails}
      style={[
        styles.chefCard,
        stretch && styles.chefCardStretch,
        { backgroundColor: colors.card },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <ListingImage uri={item.imageUrl} stretch={stretch} />
      <View style={styles.chefBody}>
        <View style={styles.avatarWrap}>
          {item.profileImageUrl ? (
            <Image source={{ uri: item.profileImageUrl }} style={styles.avatar} />
          ) : (
            <Image source={shortletPng} style={styles.avatar} />
          )}
        </View>
        <Text numberOfLines={1} style={[styles.title, { color: colors.foreground }]}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={[styles.chefBio, { color: colors.muted }]}>
          {item.subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

/** Flutter `TopChefWidget` (favourites chefs list). */
export function TopChefListCard({ item }: { item: ListingSummary }) {
  const { colors } = useTheme();

  const openDetails = () => {
    router.push(`/listing/${item.kind}/${item.id}` as Href);
  };

  return (
    <Pressable
      onPress={openDetails}
      style={[styles.topChef, { backgroundColor: colors.card }]}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.topChefCover} resizeMode="cover" />
      ) : (
        <Image source={shortletPng} style={styles.topChefCover} resizeMode="cover" />
      )}
      <View style={styles.topChefBody}>
        <View style={styles.topChefAvatarWrap}>
          {item.profileImageUrl ? (
            <Image source={{ uri: item.profileImageUrl }} style={styles.topChefAvatar} />
          ) : (
            <Image source={shortletPng} style={styles.topChefAvatar} />
          )}
        </View>
        <View style={styles.topChefText}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.foreground }]}>
            {item.title}
          </Text>
          <Text numberOfLines={2} style={[styles.chefBio, { color: colors.muted }]}>
            {item.subtitle}
          </Text>
          <Text style={[styles.price, { color: colors.foreground }]}>
            {formatNaira(item.price ?? 0, 0)}
            <Text style={[styles.suffix, { color: colors.muted }]}>
              {item.priceSuffix ?? ""}
            </Text>
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 180,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 2,
  },
  cardStretch: {
    width: "100%",
  },
  image: {
    width: 180,
    height: 140,
  },
  imageStretch: {
    width: "100%",
    height: 140,
  },
  body: {
    padding: spacing.sm,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  subtitle: {
    fontSize: 12,
    flex: 1,
  },
  price: {
    marginTop: spacing.xs,
    fontSize: 16,
    fontWeight: "600",
  },
  suffix: {
    fontSize: 12,
    fontWeight: "400",
  },
  chefCard: {
    width: 170,
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  chefCardStretch: {
    width: "100%",
  },
  chefBody: {
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    marginTop: -36,
  },
  avatarWrap: {
    borderRadius: 50,
    overflow: "hidden",
    marginBottom: spacing.xs,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  chefBio: {
    fontSize: 11.5,
    textAlign: "center",
  },
  topChef: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  topChefCover: {
    width: "100%",
    height: 70,
  },
  topChefBody: {
    flexDirection: "row",
    padding: spacing.sm,
    gap: spacing.sm,
    alignItems: "center",
  },
  topChefAvatarWrap: {
    marginTop: -28,
  },
  topChefAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  topChefText: {
    flex: 1,
    gap: 2,
  },
});
