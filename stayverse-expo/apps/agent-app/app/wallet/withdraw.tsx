import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Stack, router, type Href } from "expo-router";
import {
  useBanksQuery,
  useResolveBankAccountMutation,
  useWithdrawFundsMutation,
  validateAccountNumber,
  validateMoney,
  validatePassword,
} from "@stayverse/core";
import {
  Button,
  Text,
  TextField,
  showToast,
  spacing,
  useTheme,
} from "@stayverse/ui";

type Bank = { id: string; name: string; code: string };

function parseAmount(raw: string): number | null {
  const cleaned = String(raw).replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function isNigeriaAccountNumberValid(value: string): boolean {
  return /^\d{10}$/.test(value.trim());
}

/** Flutter `WithdrawPage`. */
export default function WithdrawScreen() {
  const { colors } = useTheme();
  const banksQuery = useBanksQuery();
  const resolveMutation = useResolveBankAccountMutation();
  const withdrawMutation = useWithdrawFundsMutation();

  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [bankFilter, setBankFilter] = useState("");
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({
    account: false,
    amount: false,
    password: false,
  });

  const banks = banksQuery.data ?? [];
  const filteredBanks = useMemo(() => {
    const q = bankFilter.trim().toLowerCase();
    if (!q) return banks;
    return banks.filter((b) => b.name.toLowerCase().includes(q));
  }, [bankFilter, banks]);

  const accountError = touched.account
    ? validateAccountNumber(accountNumber)
    : null;
  const amountError = touched.amount
    ? validateMoney(amount, { minAllowed: 1000, maxAllowed: 1_000_000 })
    : null;
  const passwordError = touched.password ? validatePassword(password) : null;

  const resolveAccount = useCallback(
    async (number: string, bank: Bank | null) => {
      setAccountName(null);
      if (!isNigeriaAccountNumberValid(number)) return;
      if (!bank) {
        showToast({ type: "error", title: "Please Select a Bank" });
        return;
      }
      try {
        const resolved = await resolveMutation.mutateAsync({
          accountNumber: number.trim(),
          bankCode: bank.code,
        });
        setAccountName(resolved.accountName);
      } catch (e) {
        setAccountName(null);
        showToast({
          type: "error",
          title: e instanceof Error ? e.message : "Account Name Not Found",
        });
      }
    },
    [resolveMutation],
  );

  useEffect(() => {
    if (!isNigeriaAccountNumberValid(accountNumber) || !selectedBank) return;
    const handle = setTimeout(() => {
      void resolveAccount(accountNumber, selectedBank);
    }, 350);
    return () => clearTimeout(handle);
  }, [accountNumber, resolveAccount, selectedBank]);

  const onConfirm = () => {
    setTouched((t) => ({ ...t, account: true, amount: true }));
    const accErr = validateAccountNumber(accountNumber);
    const amtErr = validateMoney(amount, {
      minAllowed: 1000,
      maxAllowed: 1_000_000,
    });
    if (accErr || amtErr) return;
    if (!selectedBank) {
      showToast({
        type: "error",
        title: "No Bank Selected",
        message: "Select Bank",
      });
      return;
    }
    if (!accountName?.trim()) {
      showToast({
        type: "error",
        title: "Account Name Not Found",
        message: "Enter A Valid Account Number And Bank",
      });
      return;
    }
    setPassword("");
    setTouched((t) => ({ ...t, password: false }));
    setPasswordOpen(true);
  };

  const onWithdraw = async () => {
    setTouched((t) => ({ ...t, password: true }));
    if (validatePassword(password)) return;
    if (!selectedBank || !accountName) return;
    const amountValue = parseAmount(amount);
    if (amountValue == null) return;

    try {
      await withdrawMutation.mutateAsync({
        fullName: accountName,
        accountNumber: accountNumber.trim(),
        bankCode: selectedBank.code,
        amount: amountValue,
        password,
      });
      setPasswordOpen(false);
      const qs = new URLSearchParams({
        amount: String(amountValue),
        bankName: selectedBank.name,
        accountName,
        accountNumber: accountNumber.trim(),
        timestamp: new Date().toISOString(),
      }).toString();
      router.replace(`/wallet/withdraw-success?${qs}` as Href);
    } catch (e) {
      showToast({
        type: "error",
        title: e instanceof Error ? e.message : "Please Try Again",
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: "Withdraw to bank" }} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => {
            setBankFilter("");
            setBankPickerOpen(true);
          }}
          style={[
            styles.bankSelect,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Select bank"
        >
          <View style={styles.bankSelectInner}>
            {selectedBank ? (
              <View
                style={[
                  styles.bankAvatar,
                  { backgroundColor: `${colors.muted}26` },
                ]}
              >
                <Text style={{ color: colors.muted, fontWeight: "700" }}>
                  {selectedBank.name.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            ) : null}
            <Text
              style={{
                flex: 1,
                color: selectedBank ? colors.foreground : colors.muted,
              }}
              numberOfLines={1}
            >
              {selectedBank?.name ?? "Select Bank"}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 22 }}>▾</Text>
          </View>
        </Pressable>

        <TextField
          placeholder="Account Number"
          value={accountNumber}
          onChangeText={(v) => setAccountNumber(v.replace(/\D/g, "").slice(0, 10))}
          onBlur={() => setTouched((t) => ({ ...t, account: true }))}
          keyboardType="number-pad"
          maxLength={10}
          error={accountError ?? undefined}
        />
        {resolveMutation.isPending ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ alignSelf: "stretch" }}
          />
        ) : accountName ? (
          <Text
            style={[
              styles.accountName,
              { color: colors.foreground, borderBottomColor: colors.foreground },
            ]}
          >
            {accountName}
          </Text>
        ) : null}

        <TextField
          placeholder="Enter Amount"
          value={amount}
          onChangeText={setAmount}
          onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
          keyboardType="decimal-pad"
          error={amountError ?? undefined}
          prefix={
            <Text style={{ color: colors.muted, fontWeight: "600" }}>₦</Text>
          }
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Confirm"
          onPress={onConfirm}
          loading={withdrawMutation.isPending}
        />
      </View>

      <Modal
        visible={bankPickerOpen}
        animationType="slide"
        onRequestClose={() => setBankPickerOpen(false)}
      >
        <View style={[styles.flex, { backgroundColor: colors.background }]}>
          <View style={styles.pickerHeader}>
            <Text style={[styles.pickerTitle, { color: colors.foreground }]}>
              Select Bank
            </Text>
            <Button
              label="Close"
              variant="ghost"
              fullWidth={false}
              onPress={() => setBankPickerOpen(false)}
            />
          </View>
          <View style={styles.pickerSearch}>
            <TextField
              placeholder="Search banks"
              value={bankFilter}
              onChangeText={setBankFilter}
              autoCapitalize="none"
            />
          </View>
          {banksQuery.isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredBanks}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedBank(item);
                    setBankPickerOpen(false);
                    setAccountName(null);
                  }}
                  style={[
                    styles.bankRow,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <Text style={{ color: colors.foreground }}>{item.name}</Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text muted style={styles.emptyBanks}>
                  No banks found
                </Text>
              }
            />
          )}
        </View>
      </Modal>

      <Modal
        visible={passwordOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPasswordOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.sheetOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable
            style={styles.sheetDismiss}
            onPress={() => setPasswordOpen(false)}
          />
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              Enter Password
            </Text>
            <TextField
              placeholder="Enter Password"
              value={password}
              onChangeText={setPassword}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              secureTextEntry
              error={passwordError ?? undefined}
            />
            <Button
              label="Withdraw"
              onPress={() => void onWithdraw()}
              loading={withdrawMutation.isPending}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingTop: 30,
  },
  bankSelect: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  bankSelectInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bankAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  accountName: {
    alignSelf: "flex-end",
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  pickerTitle: { fontSize: 18, fontWeight: "500" },
  pickerSearch: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  bankRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  emptyBanks: { textAlign: "center", marginTop: spacing.xl },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
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
});
