import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "../theme/Text";
import { radius, spacing } from "../theme/tokens";

type SheetKind = "terms" | "privacy" | null;

const TERMS_SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. Use of Services",
    body: "Stayverse provides a platform that connects users to verified apartments, vehicles, and catering services. Users must be at least 18 years old to use our platform. You agree to provide accurate information and comply with all applicable laws when using our services.",
  },
  {
    title: "2. Bookings and Payments",
    body: "All bookings made through Stayverse must be paid in full at the time of confirmation unless otherwise stated. You authorize Stayverse to charge your selected payment method for all bookings and related fees.",
  },
  {
    title: "3. Cancellations and Refunds",
    body: "Cancellations are subject to the Stayverse Cancellation Policy. Refund eligibility will depend on the timing of your cancellation. No-shows are non-refundable.",
  },
  {
    title: "4. User Responsibilities",
    body: "Users are expected to treat hosts, drivers, and chefs respectfully and responsibly. Any misuse, abuse, or violation of our policies may result in account suspension or termination.",
  },
  {
    title: "5. Liability",
    body: "Stayverse acts as an intermediary platform and is not directly responsible for the services provided by hosts, drivers, or chefs. We do not guarantee the accuracy of listings but ensure all are verified at the time of posting.",
  },
  {
    title: "6. Modifications",
    body: "Stayverse reserves the right to modify or update these Terms at any time. Continued use of our services after updates constitutes acceptance of the revised Terms.",
  },
];

const PRIVACY_SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. Information We Collect",
    body: "We may collect personal details such as your name, email address, phone number, payment information, and booking history. We may also collect non-personal information such as device type, browser, and location data for service optimization.",
  },
  {
    title: "2. How We Use Your Information",
    body: "Your information is used to process bookings, facilitate communication with hosts and service providers, improve our services, and provide customer support.",
  },
  {
    title: "3. Sharing of Information",
    body: "Stayverse will never sell your information to third parties. We may share your information with hosts, drivers, and chefs strictly for fulfilling your bookings. We may also disclose data if required by law or to protect our rights.",
  },
  {
    title: "4. Data Security",
    body: "We implement industry-standard security measures to safeguard your data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.",
  },
  {
    title: "5. Your Rights",
    body: "You have the right to access, update, or request deletion of your personal information. You may also opt out of marketing communications at any time.",
  },
  {
    title: "6. Updates to this Policy",
    body: "Stayverse may update this Privacy Policy from time to time. Any changes will be communicated on our platform. Continued use of our services indicates acceptance of the revised policy.",
  },
];

/**
 * Flutter `TermsAndConditionsSheet` / `PrivacyPolicySheet` — signup legal copy.
 */
export function LegalSheetsHost({
  children,
}: {
  children: (api: {
    showTerms: () => void;
    showPrivacy: () => void;
  }) => React.ReactNode;
}) {
  const [kind, setKind] = useState<SheetKind>(null);
  const isTerms = kind === "terms";
  const sections = isTerms ? TERMS_SECTIONS : PRIVACY_SECTIONS;
  const title = isTerms
    ? "Stayverse Terms and Conditions"
    : "Stayverse Privacy Policy";
  const intro = isTerms
    ? "Welcome to Stayverse! These Terms and Conditions govern your use of our platform, services, and applications. By accessing or using Stayverse, you agree to comply with and be bound by these Terms. If you do not agree, please refrain from using our services."
    : "Stayverse values your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and protect your data when you use our platform and services.";

  return (
    <>
      {children({
        showTerms: () => setKind("terms"),
        showPrivacy: () => setKind("privacy"),
      })}
      <Modal
        visible={kind != null}
        animationType="slide"
        transparent
        onRequestClose={() => setKind(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sheetTitle}>{title}</Text>
              <Text style={styles.intro}>{intro}</Text>
              {sections.map((s) => (
                <View key={s.title} style={styles.section}>
                  <Text style={styles.sectionTitle}>{s.title}</Text>
                  <Text style={styles.sectionBody}>{s.body}</Text>
                </View>
              ))}
            </ScrollView>
            <Pressable style={styles.closeBtn} onPress={() => setKind(null)}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: spacing.md,
  },
  handle: {
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: "#D1D5DB",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    fontFamily: "NeueMontreal-Bold",
    marginBottom: 14,
  },
  intro: {
    fontSize: 14,
    fontWeight: "400",
    color: "#4B5563",
    fontFamily: "NeueMontreal-Regular",
    marginBottom: 32,
    lineHeight: 20,
  },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "NeueMontreal-Medium",
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 14,
    fontWeight: "400",
    color: "#4B5563",
    fontFamily: "NeueMontreal-Regular",
    lineHeight: 20,
  },
  closeBtn: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  closeText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FBC036",
    fontFamily: "NeueMontreal-Medium",
  },
});
