import { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Stack, router, type Href } from "expo-router";
import type { ServiceType } from "@stayverse/core";
import { useAuthStore } from "@stayverse/core";
import {
  ellipse11Png,
  ellipse12Png,
  ellipse13Png,
  ellipse14Png,
  ellipse15Png,
} from "@stayverse/assets";
import { Text, spacing } from "@stayverse/ui";

const BG = "#2C2C2C";
const YELLOW = "#FBC036";
const GREY_BORDER = "#D9D9D9";

type RoleBtn = {
  type: ServiceType;
  label: string;
  bg: string;
  text: string;
};

const ROLES: RoleBtn[] = [
  {
    type: "chef",
    label: "Sign up as Chef",
    bg: YELLOW,
    text: "#000000",
  },
  {
    type: "apartment",
    label: "Sign up as Apartment Owner",
    bg: "#FFFFFF",
    text: "#000000",
  },
  {
    type: "ride",
    label: "Sign up as Car Owner",
    bg: "#000000",
    text: "#FFFFFF",
  },
];

function Bubble({
  source,
  size,
  style,
}: {
  source: number;
  size: number;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 4,
          borderColor: GREY_BORDER,
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
        },
        style,
      ]}
    >
      <Image source={source} style={{ width: size, height: size }} resizeMode="cover" />
    </View>
  );
}

/**
 * Flutter `SignupAsPage` — dark pattern bg, bubble collage, role CTAs.
 */
export default function SignupAsScreen() {
  const { width, height } = useWindowDimensions();
  const setServiceType = useAuthStore((s) => s.setServiceType);
  const isTablet = width > 600;
  const baseWidth = isTablet ? 600 : width;

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide]);

  const pick = (type: ServiceType) => {
    setServiceType(type);
    router.push(`/(auth)/signup?serviceType=${type}` as Href);
  };

  return (
    <>
      <Stack.Screen options={{ title: "", headerShown: false }} />
      <View style={[styles.root, { backgroundColor: BG }]}>
        {/* Soft pattern stand-in (Flutter SVG pattern) */}
        <View pointerEvents="none" style={styles.patternLayer}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.patternRing,
                {
                  width: width * (0.9 + i * 0.25),
                  height: height * (0.55 + i * 0.12),
                  borderRadius: width,
                  left: -width * (0.2 + i * 0.08),
                  top: height * (0.05 + i * 0.04),
                },
              ]}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: height * 0.12, maxWidth: 600, alignSelf: "center", width: "100%" },
          ]}
        >
          <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
            <View style={{ paddingBottom: height * 0.025, paddingRight: baseWidth * 0.16 }}>
              <View style={{ alignItems: "flex-end" }}>
                <Bubble source={ellipse15Png} size={baseWidth * 0.2} />
              </View>
            </View>

            <View style={[styles.cluster, { height: baseWidth * 0.52 }]}>
              <Bubble
                source={ellipse13Png}
                size={baseWidth * 0.22}
                style={{ position: "absolute", left: 0 }}
              />
              <Bubble
                source={ellipse12Png}
                size={baseWidth * 0.22}
                style={{ position: "absolute", right: 0 }}
              />
              <Bubble source={ellipse11Png} size={baseWidth * 0.46} />
            </View>

            <View style={{ paddingTop: height * 0.025, paddingLeft: baseWidth * 0.2 }}>
              <View style={{ alignItems: "flex-start" }}>
                <Bubble source={ellipse14Png} size={baseWidth * 0.16} />
              </View>
            </View>

            <View style={styles.roleCard}>
              {ROLES.map((role) => (
                <Pressable
                  key={role.type}
                  accessibilityRole="button"
                  onPress={() => pick(role.type)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
                >
                  <View style={[styles.roleBtn, { backgroundColor: role.bg }]}>
                    <Text style={[styles.roleLabel, { color: role.text }]}>
                      {role.label}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <View style={{ height: height * 0.05 }} />
          </Animated.View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  patternLayer: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
    opacity: 0.2,
  },
  patternRing: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.59)",
  },
  scroll: {
    paddingBottom: spacing.xl,
  },
  cluster: {
    alignItems: "center",
    justifyContent: "center",
  },
  roleCard: {
    marginTop: 28,
    marginHorizontal: 24,
    gap: 12,
  },
  roleBtn: {
    minHeight: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  roleLabel: {
    fontSize: 16,
    fontFamily: "NeueMontreal-Medium",
    textAlign: "center",
  },
});
