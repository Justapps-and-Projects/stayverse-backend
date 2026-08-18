import { useCallback, useRef, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Button, LegalSheetsHost, Text, spacing, useTheme } from "@stayverse/ui";

export type OnboardingSlide = {
  image: ImageSourcePropType;
  title: string;
};

export type OnboardingCarouselProps = {
  slides: OnboardingSlide[];
  /** User = primary yellow CTA; agent = dark */
  ctaVariant?: "primary" | "dark";
  /** Agent legal footer uses w400 */
  legalWeight?: "400" | "500";
  onComplete: () => void;
};

/** Layered white fade over hero images (Flutter triple WhiteGradient). */
function BottomFade() {
  return (
    <>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.08)" }]}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "55%",
          backgroundColor: "rgba(255,255,255,0.45)",
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "38%",
          backgroundColor: "rgba(255,255,255,0.85)",
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "22%",
          backgroundColor: "#FFFFFF",
        }}
      />
    </>
  );
}

/**
 * Flutter onboarding carousel — full-bleed images, dots, Next / Get Started, legal.
 */
export function OnboardingCarousel({
  slides,
  ctaVariant = "primary",
  legalWeight = "500",
  onComplete,
}: OnboardingCarouselProps) {
  const { width, height } = useWindowDimensions();
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const isLast = page >= slides.length - 1;

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const idx = Math.round(x / width);
      if (idx !== page) setPage(idx);
    },
    [page, width],
  );

  const goNext = useCallback(() => {
    if (!isLast) {
      scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
      return;
    }
    onComplete();
  }, [isLast, onComplete, page, width]);

  return (
    <LegalSheetsHost>
      {({ showTerms, showPrivacy }) => (
        <View style={styles.root}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScroll}
            scrollEventThrottle={16}
            bounces={false}
          >
            {slides.map((slide, i) => (
              <View key={i} style={{ width, height }}>
                <Image source={slide.image} style={styles.image} resizeMode="cover" />
                <BottomFade />
              </View>
            ))}
          </ScrollView>

          <View style={[styles.footer, { height: height * 0.4, paddingHorizontal: 16 }]}>
            <View style={styles.dots}>
              {slides.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      width: i === page ? 24 : 12,
                      backgroundColor:
                        i === page ? colors.primary : "rgba(158,158,158,0.35)",
                    },
                  ]}
                />
              ))}
            </View>

            <Text style={styles.title}>{slides[page]?.title ?? ""}</Text>

            <View style={{ height: 25 }} />

            <Button
              label={isLast ? "Get Started" : "Next"}
              variant={ctaVariant}
              onPress={goNext}
            />

            <View style={{ height: 40 }} />

            <Text style={[styles.legal, { fontWeight: legalWeight }]}>
              By continuing, you agree to our{" "}
              <Text
                style={[styles.legalLink, { color: colors.primary }]}
                onPress={showTerms}
              >
                Terms &{"\n"}Conditions
              </Text>
              {" and "}
              <Text
                style={[styles.legalLink, { color: colors.primary }]}
                onPress={showPrivacy}
              >
                Privacy Policy
              </Text>
            </Text>

            <View style={{ height: 30 }} />
          </View>
        </View>
      )}
    </LegalSheetsHost>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  image: { width: "100%", height: "100%" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    paddingBottom: spacing.sm,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
    lineHeight: 26,
    fontFamily: "NeueMontreal-Bold",
  },
  legal: {
    textAlign: "center",
    fontSize: 12,
    color: "#000000",
    fontFamily: "NeueMontreal-Medium",
    lineHeight: 18,
  },
  legalLink: {
    fontSize: 12,
    fontFamily: "NeueMontreal-Medium",
  },
});
