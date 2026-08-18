import { Stack } from "expo-router";
import { ListedListingsScreen } from "../../src/features/listings/ListedListingsScreen";

export default function ListedRidesRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Cars" }} />
      <ListedListingsScreen kind="ride" />
    </>
  );
}
