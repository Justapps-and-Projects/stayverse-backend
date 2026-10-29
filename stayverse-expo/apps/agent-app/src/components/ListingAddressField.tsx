import { useState } from "react";
import { View } from "react-native";
import { PlacesAutocompleteField } from "@stayverse/core";
import { Button, Text, TextField } from "@stayverse/ui";

/** A typed address is sufficient; Places search is an optional enhancement. */
export function ListingAddressField({
  address,
  onChange,
}: {
  address: string;
  onChange: (address: string, placeId: string | null) => void;
}) {
  const [search, setSearch] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      {search ? (
        <PlacesAutocompleteField
          label="Address"
          value={address}
          onChangeText={(text) => onChange(text, null)}
          onSelect={(place) => onChange(place.description, place.placeId)}
          placeholder="Search for an address"
        />
      ) : (
        <TextField
          label="Address"
          value={address}
          onChangeText={(text) => onChange(text, null)}
          placeholder="Street address, area, city and state"
          multiline
        />
      )}
      <Text muted>You can save your typed address without choosing a suggestion.</Text>
      <Button
        label={search ? "Enter address manually" : "Search address suggestions"}
        onPress={() => setSearch((value) => !value)}
      />
    </View>
  );
}
