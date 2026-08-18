import { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import {
  useSubmitReviewMutation,
  type CatalogServiceType,
} from "@stayverse/core";
import {
  Button,
  Text,
  TextField,
  showToast,
  spacing,
  useTheme,
} from "@stayverse/ui";

/** Flutter `LeaveAReviewPage`. */
export default function LeaveReviewScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    serviceType?: string;
    serviceId?: string;
  }>();
  const serviceType = (params.serviceType ?? "apartment") as CatalogServiceType;
  const serviceId = params.serviceId ?? "";
  const mutation = useSubmitReviewMutation();

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  const canSubmit = useMemo(
    () => rating > 0 && serviceId.length > 0,
    [rating, serviceId],
  );

  const submit = async () => {
    if (!canSubmit) {
      showToast({ type: "error", title: "Please select a rating" });
      return;
    }
    try {
      await mutation.mutateAsync({
        serviceType,
        serviceId,
        rating,
        review: review.trim(),
      });
      showToast({ type: "success", title: "Review submitted" });
      router.back();
    } catch (e) {
      showToast({
        type: "error",
        title: e instanceof Error ? e.message : "Please Try Again",
      });
    }
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "Rating" }} />
      <Text style={[styles.heading, { color: colors.foreground }]}>
        Rate Your Experience
      </Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)} hitSlop={8}>
            <Text style={{ fontSize: 40, color: n <= rating ? "#F59E0B" : "#D9D9D9" }}>
              ★
            </Text>
          </Pressable>
        ))}
      </View>
      <TextField
        placeholder="Write a review (optional)"
        value={review}
        onChangeText={setReview}
        multiline
        style={{ minHeight: 100, textAlignVertical: "top" }}
      />
      <Button
        label="Submit"
        onPress={() => void submit()}
        loading={mutation.isPending}
        disabled={!canSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
    paddingTop: 80,
  },
  heading: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  stars: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
});
