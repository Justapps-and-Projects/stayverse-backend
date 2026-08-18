import { Stack } from "expo-router";
import { WalletScreen } from "../../src/features/wallet/WalletScreen";

export default function WalletRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Wallet" }} />
      <WalletScreen />
    </>
  );
}
