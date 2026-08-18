import React, { useCallback, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Link, type Href } from "expo-router";
import type BottomSheet from "@gorhom/bottom-sheet";
import {
  AppBottomSheet,
  AppModal,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingSpinner,
  Skeleton,
  Text,
  TextField,
  showToast,
  spacing,
  useTheme,
} from "@stayverse/ui";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="h4" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function ComponentsKitchenSink() {
  const { colors, scheme, toggle, setMode, mode } = useTheme();
  const sheetRef = useRef<BottomSheet>(null);
  const [sheetIndex, setSheetIndex] = useState(-1);
  const [modalOpen, setModalOpen] = useState(false);
  const [overlay, setOverlay] = useState(false);

  const openSheet = useCallback(() => {
    setSheetIndex(0);
    sheetRef.current?.snapToIndex(0);
  }, []);

  const nwDemoClass = useMemo(
    () => (scheme === "dark" ? "bg-dark-bg" : "bg-background"),
    [scheme],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} className={nwDemoClass}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="h2">Stayverse UI</Text>
        <Text variant="body" muted>
          Kitchen sink — compare against Flutter Stayverse
        </Text>

        <Section title="Theme">
          <Text variant="bodySmall">
            Mode: {mode} · Scheme: {scheme}
          </Text>
          <View style={styles.row}>
            <Button label="Toggle light/dark" onPress={toggle} fullWidth={false} />
            <Button
              label="System"
              variant="outline"
              onPress={() => setMode("system")}
              fullWidth={false}
            />
          </View>
          <View
            className="mt-md rounded-md border border-border p-md dark:border-dark-fg"
            style={{ backgroundColor: colors.card }}
          >
            <Text variant="bodySmall">
              NativeWind demo box (uses dark: classes + token utilities)
            </Text>
          </View>
        </Section>

        <Section title="Button">
          <View style={styles.stack}>
            <Button label="Primary" variant="primary" />
            <Button label="Secondary" variant="secondary" />
            <Button label="Outline" variant="outline" />
            <Button label="Ghost" variant="ghost" />
            <Button label="Destructive" variant="destructive" />
            <Button label="Loading" loading />
            <Button label="Disabled" disabled />
          </View>
        </Section>

        <Section title="TextField">
          <TextField label="Email" placeholder="you@stayverse.com" helperText="Helper text" />
          <TextField label="Password" placeholder="••••••••" secureTextEntry error="Required" />
          <TextField
            label="With affixes"
            placeholder="Search"
            prefix={<Text muted>🔍</Text>}
            suffix={<Badge label="Go" variant="primary" />}
          />
        </Section>

        <Section title="Card / Avatar / Badge">
          <Card>
            <View style={styles.row}>
              <Avatar name="Stay Verse" size={48} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="title1">Stayverse Host</Text>
                <Text variant="bodySmall" muted>
                  Card with elevation from Flutter $styles.shadows.cardShadow
                </Text>
              </View>
            </View>
            <View style={[styles.row, { marginTop: spacing.md, flexWrap: "wrap" }]}>
              <Badge label="Default" />
              <Badge label="Primary" variant="primary" />
              <Badge label="Success" variant="success" />
              <Badge label="Error" variant="error" />
              <Badge label="Outline" variant="outline" />
            </View>
          </Card>
        </Section>

        <Section title="Loading">
          <View style={styles.row}>
            <LoadingSpinner />
            <Skeleton width={120} height={16} />
            <Skeleton width={48} height={48} rounded />
          </View>
          <Button
            label={overlay ? "Hide overlay…" : "Show overlay 1.2s"}
            variant="outline"
            onPress={() => {
              setOverlay(true);
              setTimeout(() => setOverlay(false), 1200);
            }}
          />
        </Section>

        <Section title="Toast / Modal / Sheet">
          <View style={styles.stack}>
            <Button
              label="Show toast"
              onPress={() =>
                showToast({ type: "success", title: "Booked", message: "Stay confirmed" })
              }
            />
            <Button label="Open modal" variant="secondary" onPress={() => setModalOpen(true)} />
            <Button label="Open bottom sheet" variant="outline" onPress={openSheet} />
          </View>
        </Section>

        <Section title="EmptyState">
          <EmptyState
            title="No bookings yet"
            description="When you book a stay, it will show up here."
            actionLabel="Browse stays"
            onAction={() => showToast({ title: "Browse", message: "Navigate later" })}
          />
        </Section>

        <Link href={"/" as Href} style={{ marginTop: spacing.lg }}>
          <Text variant="bodyBold" style={{ color: colors.primary }}>
            ← Back home
          </Text>
        </Link>
      </ScrollView>

      {overlay ? (
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <LoadingSpinner />
        </View>
      ) : null}

      <AppModal visible={modalOpen} title="Confirm" onClose={() => setModalOpen(false)}>
        <Text variant="body" muted style={{ marginBottom: spacing.md }}>
          Modal surface using Stayverse theme colors.
        </Text>
        <Button label="Close" onPress={() => setModalOpen(false)} />
      </AppModal>

      <AppBottomSheet
        ref={sheetRef}
        index={sheetIndex}
        onChange={setSheetIndex}
        title="Filters"
      >
        <Text variant="body" muted style={{ marginBottom: spacing.md }}>
          @gorhom/bottom-sheet with Stayverse sheet radius (20).
        </Text>
        <Button label="Close sheet" variant="outline" onPress={() => sheetRef.current?.close()} />
      </AppBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.offset,
  },
  section: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.xxs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  stack: {
    gap: spacing.sm,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
});
