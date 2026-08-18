import { useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router, type Href } from "expo-router";
import { shortletPng } from "@stayverse/assets";
import {
  extractArea,
  formatNaira,
  getStreamUserId,
  useAuthStore,
  useToggleFavouriteMutation,
  watchMessagingChannel,
  type CatalogServiceType,
  type ListingDetails,
} from "@stayverse/core";
import {
  AppIcon,
  Button,
  Text,
  showToast,
  spacing,
  useTheme,
} from "@stayverse/ui";

const CANCELLATION_POLICY =
  "You may cancel your booking at any time. For a full refund, cancellations must be made at least 24 hours before the scheduled start time. Cancellations made within 24 hours are non-refundable. In case of emergencies, please contact our support team for assistance.";

const HERO_HEIGHT = 200;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

function SectionTitle({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
      {children}
    </Text>
  );
}

function BodyText({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.bodyText, { color: colors.muted }]}>{children}</Text>
  );
}

function ImageCarousel({ images }: { images: string[] }) {
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const list = images.length > 0 ? images : [""];

  return (
    <View style={styles.carouselWrap}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
          setIndex(i);
        }}
      >
        {list.map((uri, i) => (
          <View key={`${uri}-${i}`} style={styles.carouselSlide}>
            {uri ? (
              <Image source={{ uri }} style={styles.carouselImage} />
            ) : (
              <Image source={shortletPng} style={styles.carouselImage} />
            )}
          </View>
        ))}
      </ScrollView>
      {list.length > 1 ? (
        <View style={styles.dots}>
          {list.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === index ? colors.primary : colors.border,
                },
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function FavouriteButton({
  kind,
  id,
  isFavourite,
}: {
  kind: CatalogServiceType;
  id: string;
  isFavourite: boolean;
}) {
  const { colors } = useTheme();
  const mutation = useToggleFavouriteMutation();

  return (
    <Pressable
      onPress={() => mutation.mutate({ kind, id })}
      style={[styles.favBtn, { backgroundColor: colors.card }]}
      accessibilityRole="button"
      accessibilityLabel="Favourite"
    >
      <AppIcon
        name={isFavourite ? "heart" : "favourite"}
        size={22}
        color={isFavourite ? "#E53935" : colors.muted}
      />
    </Pressable>
  );
}

function HostRow({
  title,
  listing,
}: {
  title: string;
  listing: ListingDetails;
}) {
  const { colors } = useTheme();
  const host = listing.host;
  const user = useAuthStore((s) => s.user);
  const initial = (host?.name?.[0] ?? "U").toUpperCase();
  const [chatBusy, setChatBusy] = useState(false);

  const openChat = async () => {
    const myId = getStreamUserId(user);
    const agentId = host?.id;
    if (!myId) {
      showToast({
        type: "error",
        title: "Chat Agent",
        message: "Log in/Sign Up to Chat a Agent",
      });
      return;
    }
    if (!agentId) {
      showToast({
        type: "error",
        title: "Call Agent",
        message: "Could not open chat at this moment, Try calling this Agent",
      });
      return;
    }
    setChatBusy(true);
    try {
      const channel = await watchMessagingChannel(
        [myId, agentId],
        listing.title || host?.name || "",
      );
      router.push(`/chat/${encodeURIComponent(channel.cid)}` as Href);
    } catch (e) {
      showToast({
        type: "error",
        title: "Call Agent",
        message:
          e instanceof Error
            ? e.message
            : "Could not open chat at this moment, Try calling this Agent",
      });
    } finally {
      setChatBusy(false);
    }
  };

  return (
    <View style={styles.hostBlock}>
      <SectionTitle>{title}</SectionTitle>
      <View style={styles.hostRow}>
        <View style={[styles.hostAvatar, { backgroundColor: colors.border }]}>
          {host?.avatarUrl ? (
            <Image source={{ uri: host.avatarUrl }} style={styles.hostAvatarImg} />
          ) : (
            <Text style={{ color: colors.foreground, fontWeight: "600" }}>
              {initial}
            </Text>
          )}
        </View>
        <Text style={[styles.hostName, { color: colors.foreground }]}>
          {host?.name ?? "Host"}
        </Text>
        <View style={styles.hostActions}>
          <Pressable
            onPress={() => void openChat()}
            disabled={chatBusy}
            accessibilityLabel="Chat with agent"
            style={styles.iconBtn}
          >
            <AppIcon name="message" size={22} color={colors.foreground} />
          </Pressable>
          <Pressable
            onPress={() => {
              if (host?.phone) {
                void Linking.openURL(`tel:${host.phone}`);
              } else {
                showToast({
                  type: "error",
                  title: "Call",
                  message: "Phone number not available",
                });
              }
            }}
            accessibilityLabel="Call with agent"
            style={styles.iconBtn}
          >
            <AppIcon name="call" size={22} color={colors.foreground} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function AmenitiesBlock({
  title,
  items,
  showAllLabel,
  showLessLabel,
}: {
  title: string;
  items: string[];
  showAllLabel: string;
  showLessLabel: string;
}) {
  const { colors } = useTheme();
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, 6);

  if (items.length === 0) return null;

  return (
    <View style={styles.block}>
      <SectionTitle>{title}</SectionTitle>
      {visible.map((item) => (
        <Text key={item} style={[styles.amenity, { color: colors.muted }]}>
          • {item}
        </Text>
      ))}
      {items.length > 6 ? (
        <Pressable
          onPress={() => setShowAll((v) => !v)}
          style={[styles.showAll, { backgroundColor: colors.secondary }]}
        >
          <Text style={[styles.showAllText, { color: colors.foreground }]}>
            {showAll ? showLessLabel : showAllLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ServiceDetailBody({ listing }: { listing: ListingDetails }) {
  const { colors } = useTheme();
  const isApartment = listing.kind === "apartment";
  const detailsTitle = isApartment ? "Apartment Details" : "Ride Details";
  const featuresTitle = isApartment ? "Apartment Features" : "Ride Features";
  const ownerTitle = isApartment ? "Apartment Owner" : "Vehicle Owner";
  const locationTitle = isApartment ? "Where you'll be" : "Ride Location";
  const locationText = isApartment
    ? extractArea(listing.address)
    : listing.address ?? "--";

  return (
    <>
      <View style={styles.pad}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
            {listing.title}
          </Text>
          <FavouriteButton
            kind={listing.kind}
            id={listing.id}
            isFavourite={listing.isFavourite}
          />
        </View>

        {listing.averageRating != null ? (
          <Text style={[styles.rating, { color: colors.muted }]}>
            ★ {listing.averageRating.toFixed(1)}
          </Text>
        ) : null}

        <Text style={[styles.price, { color: colors.foreground }]}>
          {formatNaira(listing.price ?? 0)}
          <Text style={{ color: colors.muted, fontSize: 16, fontWeight: "500" }}>
            {listing.priceSuffix ?? ""}
          </Text>
        </Text>

        <View style={[styles.divider, { backgroundColor: colors.secondary }]} />

        <SectionTitle>{detailsTitle}</SectionTitle>
        <BodyText>{listing.description ?? "No details available"}</BodyText>

        <View style={styles.statsRow}>
          {isApartment ? (
            <>
              <Text style={styles.stat}>
                {listing.bedrooms ?? "N/A"} Bedrooms
              </Text>
              <Text style={styles.stat}>2 Bathrooms</Text>
              <Text style={styles.stat}>
                {listing.maxGuests ?? "N/A"} Guests
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.stat}>
                {listing.maxPassengers ?? "N/A"} Passengers
              </Text>
              <Text style={styles.stat}>{listing.color ?? "N/A"}</Text>
              <Text style={styles.stat}>{listing.plateNumber ?? "N/A"}</Text>
            </>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.secondary }]} />

        <AmenitiesBlock
          title={featuresTitle}
          items={listing.amenities}
          showAllLabel={
            isApartment ? "Show all amenities" : "Show all features"
          }
          showLessLabel={
            isApartment ? "Show less amenities" : "Show less features"
          }
        />

        <HostRow title={ownerTitle} listing={listing} />

        <SectionTitle>{locationTitle}</SectionTitle>
        <View style={styles.locationRow}>
          <AppIcon name="location" size={18} color={colors.muted} />
          <Text style={[styles.locationText, { color: colors.muted }]}>
            {locationText}
          </Text>
        </View>
        {isApartment ? (
          <View style={[styles.privacyNote, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.privacyText, { color: colors.muted }]}>
              Exact address and map are shared after payment is completed.
            </Text>
          </View>
        ) : null}

        <SectionTitle>Rules</SectionTitle>
        <BodyText>{listing.rules ?? "No rules available"}</BodyText>

        <SectionTitle>Cancellation Policy</SectionTitle>
        <BodyText>{CANCELLATION_POLICY}</BodyText>
      </View>

      <View style={styles.ctaPad}>
        <Button
          label="Rent now"
          onPress={() =>
            router.push(`/book/${listing.kind}/${listing.id}` as Href)
          }
        />
      </View>
    </>
  );
}

function ChefDetailBody({ listing }: { listing: ListingDetails }) {
  const { colors } = useTheme();
  const [showAllExp, setShowAllExp] = useState(false);
  const experiences = listing.experiences ?? [];
  const visibleExp = showAllExp ? experiences : experiences.slice(0, 2);

  return (
    <View style={styles.pad}>
      <View style={styles.chefCoverWrap}>
        {listing.imageUrl ? (
          <Image source={{ uri: listing.imageUrl }} style={styles.chefCover} />
        ) : (
          <Image source={shortletPng} style={styles.chefCover} />
        )}
        <View style={styles.chefFav}>
          <FavouriteButton
            kind="chef"
            id={listing.id}
            isFavourite={listing.isFavourite}
          />
        </View>
      </View>

      <View style={styles.chefAvatarWrap}>
        {listing.profileImageUrl ? (
          <Image
            source={{ uri: listing.profileImageUrl }}
            style={styles.chefAvatar}
          />
        ) : (
          <Image source={shortletPng} style={styles.chefAvatar} />
        )}
      </View>

      <View style={styles.chefHeader}>
        {listing.averageRating != null ? (
          <Text style={[styles.rating, { color: colors.muted }]}>
            ★ {listing.averageRating.toFixed(1)}
          </Text>
        ) : null}
        <Text style={[styles.title, { color: colors.foreground }]}>
          {listing.title}
        </Text>
        <Text style={[styles.bodyText, { color: colors.muted }]}>
          {listing.description ?? "No bio available"}
        </Text>
        <Text style={[styles.price, { color: colors.foreground }]}>
          {formatNaira(listing.price ?? 0)}
          <Text style={{ color: colors.muted, fontSize: 16, fontWeight: "500" }}>
            {listing.priceSuffix ?? "/hour"}
          </Text>
        </Text>
        <View style={styles.hostActions}>
          <Pressable
            onPress={() => {
              void (async () => {
                const myId = getStreamUserId(useAuthStore.getState().user);
                const peerId = listing.host?.id ?? listing.id;
                if (!myId) {
                  showToast({
                    type: "error",
                    title: "Chat Agent",
                    message: "Log in/Sign Up to Chat a Agent",
                  });
                  return;
                }
                try {
                  const channel = await watchMessagingChannel(
                    [myId, peerId],
                    listing.title,
                  );
                  router.push(
                    `/chat/${encodeURIComponent(channel.cid)}` as Href,
                  );
                } catch (e) {
                  showToast({
                    type: "error",
                    title: "Call Agent",
                    message:
                      e instanceof Error
                        ? e.message
                        : "Could not open chat at this moment",
                  });
                }
              })();
            }}
            accessibilityLabel="Chat with agent"
            style={styles.iconBtn}
          >
            <AppIcon name="message" size={22} color={colors.foreground} />
          </Pressable>
          <Pressable
            onPress={() => {
              if (listing.host?.phone) {
                void Linking.openURL(`tel:${listing.host.phone}`);
              } else {
                showToast({
                  type: "error",
                  title: "Call",
                  message: "Phone number not available",
                });
              }
            }}
            accessibilityLabel="Call with agent"
            style={styles.iconBtn}
          >
            <AppIcon name="call" size={22} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      <SectionTitle>About</SectionTitle>
      <BodyText>{listing.about ?? "No details available"}</BodyText>

      <SectionTitle>Experience</SectionTitle>
      {experiences.length === 0 ? (
        <BodyText>No Experience Found</BodyText>
      ) : (
        <>
          {visibleExp.map((exp, i) => (
            <View key={i} style={styles.expItem}>
              <Text style={[styles.expTitle, { color: colors.foreground }]}>
                {exp.title ?? "Experience"}
              </Text>
              {exp.company ? (
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {exp.company}
                </Text>
              ) : null}
              {exp.description ? <BodyText>{exp.description}</BodyText> : null}
            </View>
          ))}
          {experiences.length > 2 ? (
            <Pressable onPress={() => setShowAllExp((v) => !v)}>
              <Text style={{ color: colors.primary, fontWeight: "600" }}>
                {showAllExp ? "View less" : "View all"}
              </Text>
            </Pressable>
          ) : null}
        </>
      )}

      <SectionTitle>Featured</SectionTitle>
      {(listing.featuredImages?.length ?? 0) === 0 ? (
        <BodyText>No Featured Dish Added</BodyText>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {listing.featuredImages!.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.featuredImg} />
          ))}
        </ScrollView>
      )}

      <SectionTitle>License & Certification</SectionTitle>
      {(listing.certifications?.length ?? 0) === 0 ? (
        <BodyText>No Certifications Added</BodyText>
      ) : (
        listing.certifications!.map((cert, i) => (
          <View key={i} style={styles.expItem}>
            <Text style={[styles.expTitle, { color: colors.foreground }]}>
              {cert.name ?? "Certification"}
            </Text>
            {cert.issuer ? (
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {cert.issuer}
              </Text>
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}

type Props = {
  listing: ListingDetails;
};

/** Flutter apartment / ride / chef detail bodies. */
export function ListingDetailContent({ listing }: Props) {
  const heroImages = useMemo(() => listing.images, [listing.images]);

  if (listing.kind === "chef") {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <ChefDetailBody listing={listing} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={styles.padTop}>
        <ImageCarousel images={heroImages} />
      </View>
      <ServiceDetailBody listing={listing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl },
  pad: { paddingHorizontal: spacing.md, gap: spacing.sm },
  padTop: { padding: spacing.md },
  carouselWrap: { borderRadius: 12, overflow: "hidden" },
  carouselSlide: {
    width: SCREEN_WIDTH - 32,
    height: HERO_HEIGHT,
  },
  carouselImage: {
    width: "100%",
    height: HERO_HEIGHT,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
  },
  favBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  rating: { fontSize: 13 },
  price: { fontSize: 28, fontWeight: "700", marginTop: spacing.xs },
  divider: { height: 1, marginVertical: spacing.md },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: spacing.sm,
  },
  bodyText: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: spacing.md,
  },
  stat: { fontSize: 12, fontWeight: "500" },
  block: { gap: spacing.xs },
  amenity: { fontSize: 12, paddingVertical: 2 },
  showAll: {
    marginTop: spacing.sm,
    height: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  showAllText: { fontSize: 10.5, fontWeight: "500" },
  hostBlock: { marginTop: spacing.md, gap: spacing.sm },
  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  hostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  hostAvatarImg: { width: 40, height: 40 },
  hostName: { flex: 1, fontSize: 14, fontWeight: "500" },
  hostActions: { flexDirection: "row", gap: spacing.sm },
  iconBtn: { padding: 4 },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: { flex: 1, fontSize: 12 },
  privacyNote: {
    padding: 12,
    borderRadius: 10,
    marginTop: spacing.sm,
  },
  privacyText: { fontSize: 12, fontWeight: "500" },
  ctaPad: { padding: spacing.md },
  chefCoverWrap: { position: "relative" },
  chefCover: { width: "100%", height: 180 },
  chefFav: { position: "absolute", top: 12, right: 12 },
  chefAvatarWrap: {
    alignItems: "center",
    marginTop: -40,
  },
  chefAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#fff",
  },
  chefHeader: {
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  expItem: { marginBottom: spacing.sm, gap: 2 },
  expTitle: { fontSize: 13, fontWeight: "600" },
  featuredImg: {
    width: 120,
    height: 90,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
});
