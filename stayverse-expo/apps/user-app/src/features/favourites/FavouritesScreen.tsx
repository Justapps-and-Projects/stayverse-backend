import { useMemo } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import {
  useFavouritesQuery,
  useFavouritesUiStore,
  type CatalogServiceType,
  type HomeFeedTab,
  type ListingSummary,
} from "@stayverse/core";
import {
  AppIcon,
  LoadingSpinner,
  LottieEmptyState,
  Text,
  spacing,
  useTheme,
} from "@stayverse/ui";
import {
  ServiceListingCard,
  TopChefListCard,
} from "../discover/ListingCards";

const TABS: {
  key: HomeFeedTab;
  kind: CatalogServiceType;
  icon: "shortlet" | "car" | "chef";
  label: string;
}[] = [
  { key: "apartments", kind: "apartment", icon: "shortlet", label: "Apartments" },
  { key: "rides", kind: "ride", icon: "car", label: "Rides" },
  { key: "chefs", kind: "chef", icon: "chef", label: "Chefs" },
];

function emptyCopy(category: HomeFeedTab) {
  if (category === "apartments") {
    return {
      kind: "apartment" as const,
      title: "No Favourite Apartment Found",
    };
  }
  if (category === "rides") {
    return {
      kind: "rides" as const,
      title: "No Car Rental Found",
    };
  }
  return {
    kind: "chefs" as const,
    title: "No Top Chefs found",
    description: "Chefs not available at the moment,",
  };
}

function CategoryTab({
  icon,
  label,
  selected,
  onPress,
}: {
  icon: "shortlet" | "car" | "chef";
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.category,
        {
          backgroundColor: selected
            ? `${colors.primary}40`
            : colors.secondary,
          borderColor: selected ? `${colors.primary}80` : colors.border,
        },
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
    >
      <AppIcon
        name={icon}
        size={26}
        color={selected ? colors.primary : colors.muted}
      />
      <Text
        style={[
          styles.categoryLabel,
          { color: selected ? colors.primary : colors.muted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Flutter `FavouritePage` — Apartments / Rides / Chefs tabs. */
export function FavouritesScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const selectedCategory = useFavouritesUiStore((s) => s.selectedCategory);
  const setSelectedCategory = useFavouritesUiStore((s) => s.setSelectedCategory);

  const active = TABS.find((t) => t.key === selectedCategory) ?? TABS[0]!;
  const query = useFavouritesQuery(active.kind);
  const items = (query.data ?? []) as ListingSummary[];
  const empty = emptyCopy(selectedCategory);

  const gridGap = 10;
  const horizontalPad = spacing.md;
  const cardWidth = (width - horizontalPad * 2 - gridGap) / 2;

  const listHeader = useMemo(
    () => (
      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <CategoryTab
            key={tab.key}
            icon={tab.icon}
            label={tab.label}
            selected={tab.key === selectedCategory}
            onPress={() => setSelectedCategory(tab.key)}
          />
        ))}
      </View>
    ),
    [selectedCategory, setSelectedCategory],
  );

  const refreshing = query.isRefetching && !query.isLoading;

  if (query.isLoading) {
    return (
      <View style={[styles.wrap, { backgroundColor: colors.background }]}>
        {listHeader}
        <View style={styles.centered}>
          <LoadingSpinner />
        </View>
      </View>
    );
  }

  if (selectedCategory === "chefs") {
    return (
      <View style={[styles.wrap, { backgroundColor: colors.background }]}>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          contentContainerStyle={[
            styles.listPad,
            items.length === 0 && styles.fill,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void query.refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <LottieEmptyState
                kind={empty.kind}
                title={empty.title}
                description={"description" in empty ? empty.description : undefined}
                size={110}
              />
            </View>
          }
          renderItem={({ item }) => <TopChefListCard item={item} />}
        />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        key={selectedCategory}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        ListHeaderComponent={listHeader}
        contentContainerStyle={[
          styles.listPad,
          items.length === 0 && styles.fill,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void query.refetch()}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <LottieEmptyState
              kind={empty.kind}
              title={empty.title}
              size={110}
            />
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <ServiceListingCard item={item} stretch />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  listPad: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  fill: {
    flexGrow: 1,
  },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  category: {
    width: 70,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    gap: 3,
  },
  categoryLabel: {
    fontSize: 9,
    fontWeight: "500",
  },
  gridRow: {
    gap: 10,
    marginBottom: 10,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 280,
  },
});
