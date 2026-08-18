import { Stack } from "expo-router";
import { ListedListingsScreen } from "../../src/features/listings/ListedListingsScreen";

export default function ListedApartmentsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Apartments" }} />
      <ListedListingsScreen kind="apartment" />
    </>
  );
}
