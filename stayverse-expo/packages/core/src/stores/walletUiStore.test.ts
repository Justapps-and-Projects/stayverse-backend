import { beforeEach, describe, expect, it } from "vitest";
import { useWalletUiStore } from "./walletUiStore";

describe("useWalletUiStore", () => {
  beforeEach(() => {
    useWalletUiStore.getState().reset();
  });

  it("toggles balance visibility and tracks withdraw draft", () => {
    expect(useWalletUiStore.getState().showBalance).toBe(false);
    useWalletUiStore.getState().toggleBalance();
    expect(useWalletUiStore.getState().showBalance).toBe(true);
    useWalletUiStore.getState().setShowBalance(false);
    useWalletUiStore.getState().setSelectedBankId("bank-1");
    useWalletUiStore.getState().setWithdrawAmount("5000");
    expect(useWalletUiStore.getState()).toMatchObject({
      selectedBankId: "bank-1",
      withdrawAmount: "5000",
      showBalance: false,
    });
    useWalletUiStore.getState().reset();
    expect(useWalletUiStore.getState().withdrawAmount).toBe("");
  });
});
