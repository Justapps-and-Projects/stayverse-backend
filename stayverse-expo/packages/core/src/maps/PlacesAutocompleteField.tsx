import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { autocompletePlaces, type PlaceSuggestion } from "../location/places";

type Props = {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSelect: (suggestion: PlaceSuggestion) => void;
  debounceMs?: number;
};

/** Flutter Places autocomplete — debounce ~200ms, NG bias. */
export function PlacesAutocompleteField({
  label = "Location",
  placeholder = "Search places in Nigeria",
  value,
  onChangeText,
  onSelect,
  debounceMs = 200,
}: Props) {
  const [query, setQuery] = useState(value ?? "");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlaceSuggestion[]>([]);

  useEffect(() => {
    if (value != null) setQuery(value);
  }, [value]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      void autocompletePlaces(q).then((list) => {
        setResults(list);
        setLoading(false);
      });
    }, debounceMs);
    return () => clearTimeout(t);
  }, [query, debounceMs]);

  const onPick = useCallback(
    (item: PlaceSuggestion) => {
      setQuery(item.description);
      setResults([]);
      onSelect(item);
    },
    [onSelect],
  );

  const empty = useMemo(
    () => query.trim().length >= 2 && !loading && results.length === 0,
    [query, loading, results.length],
  );

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9D9995"
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          onChangeText?.(text);
        }}
        autoCorrect={false}
      />
      {loading ? <ActivityIndicator color="#FBC036" style={styles.loader} /> : null}
      {results.length > 0 ? (
        <View style={styles.dropdown}>
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={results}
            keyExtractor={(item) => item.placeId}
            renderItem={({ item }) => (
              <Pressable style={styles.row} onPress={() => onPick(item)}>
                <Text style={styles.main}>{item.mainText ?? item.description}</Text>
                {item.secondaryText ? (
                  <Text style={styles.secondary}>{item.secondaryText}</Text>
                ) : null}
              </Pressable>
            )}
          />
        </View>
      ) : null}
      {empty ? <Text style={styles.hint}>No places found</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: "#232C33" },
  input: {
    borderWidth: 1,
    borderColor: "#AAADB7",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2C2C2C",
    backgroundColor: "#FFFFFF",
  },
  loader: { marginTop: 8 },
  dropdown: {
    maxHeight: 220,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#AAADB7",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  row: { paddingHorizontal: 14, paddingVertical: 10, gap: 2 },
  main: { fontSize: 15, fontWeight: "600", color: "#232C33" },
  secondary: { fontSize: 13, color: "#7D7873" },
  hint: { marginTop: 4, fontSize: 13, color: "#7D7873" },
});
