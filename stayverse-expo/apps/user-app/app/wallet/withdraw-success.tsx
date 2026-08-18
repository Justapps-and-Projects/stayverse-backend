import { StyleSheet, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { formatNaira } from "@stayverse/core";
import { Button, Text, spacing, useTheme } from "@stayverse/ui";

function DetailRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

/** Flutter `WithdrawalSuccessfulPage`. */
export default function WithdrawSuccessScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    amount?: string;
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    timestamp?: string;
  }>();

  const amount = Number(params.amount ?? 0);
  const timeLabel = (() => {
    const d = params.timestamp ? new Date(params.timestamp) : new Date();
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  })();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "Withdraw Successful", headerBackVisible: true }} />
      <Text style={[styles.amount, { color: colors.foreground }]}>
        {formatNaira(Number.isFinite(amount) ? amount : 0)}
      </Text>
      <View
        style={[
          styles.card,
          {
            borderColor: colors.primary,
            backgroundColor: `${colors.primary}1A`,
          },
        ]}
      >
        <DetailRow label="Bank" value={params.bankName ?? ""} />
        <DetailRow label="Account Name" value={params.accountName ?? ""} />
        <DetailRow label="Account Number" value={params.accountNumber ?? ""} />
        <DetailRow label="Time" value={timeLabel} />
      </View>
      <View style={styles.footer}>
        <Button label="Back" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 30,
  },
  amount: {
    fontSize: 28,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 30,
  },
  card: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 22,
    gap: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  label: { fontSize: 12, fontWeight: "400" },
  value: { fontSize: 12, fontWeight: "500", flexShrink: 1, textAlign: "right" },
  footer: {
    marginTop: "auto",
    paddingBottom: spacing.lg,
  },
});
