import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import {
  StayverseWebView,
  formatNaira,
  useAuthStore,
  useFundWalletMutation,
  useProfileQuery,
  useTransactionsQuery,
  useVerifyPaymentMutation,
  useWalletQuery,
  useWalletUiStore,
  validateMoney,
  type TransactionStatus,
  type TransactionSummary,
} from "@stayverse/core";
import {
  AppIcon,
  Button,
  LoadingSpinner,
  LottieEmptyState,
  Text,
  TextField,
  showToast,
  spacing,
  useTheme,
} from "@stayverse/ui";

function statusLabel(status: TransactionStatus): string {
  if (status === "successful") return "Successful";
  if (status === "pending") return "Pending";
  if (status === "failed") return "Failed";
  if (status === "refunded") return "Refunded";
  if (status === "reversed") return "Reversed";
  return "Unknown";
}

function statusColor(status: TransactionStatus): string {
  if (status === "successful") return "#22C55E";
  if (status === "pending") return "#F59E0B";
  return "#EF4444";
}

function formatTxnDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function txnTitle(item: TransactionSummary): string {
  if (item.description?.trim()) return item.description.trim();
  return item.type === "credit" ? "Money Received" : "Money Sent";
}

function parseAmount(raw: string): number | null {
  const cleaned = String(raw).replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function WalletActionButton({
  label,
  icon,
  filled,
  onPress,
}: {
  label: string;
  icon: "add_solid" | "bank_send_sqaure";
  filled?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.actionBtn,
        {
          backgroundColor: filled ? colors.primary : colors.card,
          borderColor: colors.primary,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <AppIcon name={icon} size={20} color={colors.foreground} />
      <Text style={[styles.actionLabel, { color: colors.foreground }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function TransactionRow({ item }: { item: TransactionSummary }) {
  const { colors } = useTheme();
  const badge = statusColor(item.status);
  const sign = item.type === "credit" ? "+" : "-";

  return (
    <View style={[styles.txnRow, { borderBottomColor: colors.border }]}>
      <View
        style={[styles.txnIcon, { backgroundColor: `${colors.primary}33` }]}
      >
        <AppIcon
          name={item.type === "credit" ? "bank_recieve" : "bank_send"}
          size={20}
          color={colors.primary}
        />
      </View>
      <View style={styles.txnBody}>
        <Text
          numberOfLines={2}
          style={[styles.txnTitle, { color: colors.foreground }]}
        >
          {txnTitle(item)}
        </Text>
        <View style={styles.txnMeta}>
          <Text style={[styles.txnDate, { color: colors.muted }]}>
            {formatTxnDate(item.createdAt)}
          </Text>
          <View style={[styles.badge, { backgroundColor: `${badge}1A` }]}>
            <Text style={[styles.badgeText, { color: badge }]}>
              {statusLabel(item.status)}
            </Text>
          </View>
        </View>
      </View>
      <Text style={[styles.txnAmount, { color: colors.foreground }]}>
        {sign}
        {formatNaira(item.amount)}
      </Text>
    </View>
  );
}

/** Flutter `WalletPage`. */
export function WalletScreen() {
  const { colors } = useTheme();
  const showBalance = useWalletUiStore((s) => s.showBalance);
  const toggleBalance = useWalletUiStore((s) => s.toggleBalance);
  const balanceFromAuth = useAuthStore((s) => s.user?.balance ?? 0);

  const walletQuery = useWalletQuery();
  const txQuery = useTransactionsQuery();
  const profileQuery = useProfileQuery();
  const fundMutation = useFundWalletMutation();
  const verifyMutation = useVerifyPaymentMutation();

  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [paystackUrl, setPaystackUrl] = useState<string | null>(null);
  const [pendingReference, setPendingReference] = useState<string | null>(null);

  const balance = walletQuery.data?.balance ?? balanceFromAuth;
  const items = useMemo(
    () => txQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [txQuery.data],
  );

  const amountError = amountTouched
    ? validateMoney(amountInput, { minAllowed: 100, maxAllowed: 1_000_000 })
    : null;

  const refreshing =
    (walletQuery.isRefetching || txQuery.isRefetching) &&
    !txQuery.isFetchingNextPage;

  const onRefresh = useCallback(() => {
    void Promise.all([walletQuery.refetch(), txQuery.refetch()]);
  }, [walletQuery, txQuery]);

  const refreshAfterFund = useCallback(async () => {
    await Promise.all([
      profileQuery.refetch(),
      walletQuery.refetch(),
      txQuery.refetch(),
    ]);
  }, [profileQuery, txQuery, walletQuery]);

  const onPaystackClose = useCallback(
    async (success?: boolean) => {
      setPaystackUrl(null);
      if (!success || !pendingReference) {
        setPendingReference(null);
        return;
      }
      setBusyMessage("Verifying payment...");
      try {
        await verifyMutation.mutateAsync(pendingReference);
        setPendingReference(null);
        await refreshAfterFund();
        showToast({ type: "success", title: "Wallet funded successfully" });
      } catch (e) {
        showToast({
          type: "error",
          title: e instanceof Error ? e.message : "Please try payment again",
        });
      } finally {
        setBusyMessage(null);
      }
    },
    [pendingReference, refreshAfterFund, verifyMutation],
  );

  const submitAddFunds = async () => {
    setAmountTouched(true);
    const err = validateMoney(amountInput, {
      minAllowed: 100,
      maxAllowed: 1_000_000,
    });
    if (err) return;
    const amount = parseAmount(amountInput);
    if (amount == null) return;

    setAddFundsOpen(false);
    setBusyMessage("Processing payment...");
    try {
      const funded = await fundMutation.mutateAsync(amount);
      setBusyMessage(null);
      setPendingReference(funded.reference);
      setPaystackUrl(funded.authorizationUrl);
      setAmountInput("");
      setAmountTouched(false);
    } catch {
      setBusyMessage(null);
      showToast({ type: "error", title: "Please try payment again" });
    }
  };

  const listHeader = (
    <View>
      <View style={[styles.balancePad, { backgroundColor: colors.background }]}>
        <Text style={[styles.balanceLabel, { color: colors.muted }]}>
          My balance
        </Text>
        <View style={styles.balanceRow}>
          <Text style={[styles.balanceValue, { color: colors.foreground }]}>
            {showBalance ? formatNaira(balance) : "****"}
          </Text>
          <Pressable
            onPress={toggleBalance}
            accessibilityRole="button"
            accessibilityLabel="toggle balance"
            hitSlop={8}
          >
            <Ionicons
              name={showBalance ? "eye" : "eye-off"}
              size={24}
              color={colors.muted}
            />
          </Pressable>
        </View>
        <View style={styles.actionsRow}>
          <WalletActionButton
            label="Add Funds"
            icon="add_solid"
            onPress={() => {
              setAmountInput("");
              setAmountTouched(false);
              setAddFundsOpen(true);
            }}
          />
          <WalletActionButton
            label="Withdraw"
            icon="bank_send_sqaure"
            filled
            onPress={() => router.push("/wallet/withdraw" as Href)}
          />
        </View>
      </View>
      <View style={[styles.activitiesHeader, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.activitiesTitle, { color: colors.muted }]}>
          Activities
        </Text>
      </View>
    </View>
  );

  if (txQuery.isLoading) {
    return (
      <View style={[styles.wrap, { backgroundColor: colors.background }]}>
        {listHeader}
        <View style={styles.centered}>
          <LoadingSpinner />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        contentContainerStyle={[
          styles.listGrow,
          items.length === 0 && styles.fill,
        ]}
        style={{ backgroundColor: colors.secondary }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        onEndReached={() => {
          if (txQuery.hasNextPage && !txQuery.isFetchingNextPage) {
            void txQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          txQuery.isFetchingNextPage ? (
            <View style={styles.footer}>
              <LoadingSpinner size="small" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={[styles.centered, { backgroundColor: colors.secondary }]}>
            <LottieEmptyState kind="empty" title="No Transactions" size={110} />
          </View>
        }
        renderItem={({ item }) => <TransactionRow item={item} />}
      />

      <Modal
        visible={addFundsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setAddFundsOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.sheetOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable
            style={styles.sheetDismiss}
            onPress={() => setAddFundsOpen(false)}
          />
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              Add Funds
            </Text>
            <TextField
              placeholder="Amount"
              value={amountInput}
              onChangeText={setAmountInput}
              onBlur={() => setAmountTouched(true)}
              keyboardType="decimal-pad"
              error={amountError ?? undefined}
              prefix={
                <Text style={{ color: colors.muted, fontWeight: "600" }}>₦</Text>
              }
            />
            <Button
              label="Continue"
              onPress={() => void submitAddFunds()}
              loading={fundMutation.isPending}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!busyMessage} transparent animationType="fade">
        <View style={styles.busyOverlay}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={{ color: "#fff", marginTop: spacing.md }}>
            {busyMessage}
          </Text>
        </View>
      </Modal>

      <Modal visible={!!paystackUrl} animationType="slide">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.paystackHeader}>
            <Text style={{ fontSize: 18, fontWeight: "500" }}>Wallet</Text>
            <Button
              label="Close"
              variant="ghost"
              fullWidth={false}
              onPress={() => void onPaystackClose(false)}
            />
          </View>
          {paystackUrl ? (
            <StayverseWebView
              url={paystackUrl}
              mode="paystack"
              onClose={(ok) => void onPaystackClose(ok)}
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  listGrow: { flexGrow: 1 },
  fill: { flexGrow: 1 },
  balancePad: {
    padding: spacing.md,
    paddingTop: spacing.lg,
    gap: 2,
  },
  balanceLabel: {
    fontSize: 14,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  balanceValue: {
    fontSize: 38,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionLabel: {
    fontWeight: "400",
  },
  activitiesHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  activitiesTitle: {
    fontSize: 14,
    fontWeight: "400",
  },
  txnRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 11,
  },
  txnIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  txnBody: {
    flex: 1,
    gap: 2,
  },
  txnTitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  txnMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  txnDate: {
    fontSize: 11,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "500",
  },
  txnAmount: {
    fontSize: 13,
    fontWeight: "500",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },
  footer: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheetDismiss: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 32,
    gap: spacing.md,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "500",
    textAlign: "center",
  },
  busyOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  paystackHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
});
