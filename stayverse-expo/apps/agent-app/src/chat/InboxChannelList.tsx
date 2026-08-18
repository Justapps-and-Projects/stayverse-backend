import { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { router, type Href } from "expo-router";
import { ChannelList, WithComponents } from "stream-chat-expo";
import type { Channel } from "stream-chat";
import {
  getStreamUserId,
  useAuthStore,
  useStreamUiStore,
} from "@stayverse/core";
import { EmptyState, Text, spacing, useTheme } from "@stayverse/ui";

function InboxEmpty() {
  return (
    <EmptyState
      title="No conversations yet"
      description="Guests will appear here when they message you."
    />
  );
}

export function InboxChannelList() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const ready = useStreamUiStore((s) => s.ready);
  const streamUserId = getStreamUserId(user);

  const filters = useMemo(
    () =>
      streamUserId
        ? {
            type: "messaging",
            members: { $in: [streamUserId] },
          }
        : undefined,
    [streamUserId],
  );

  const sort = useMemo(() => [{ last_message_at: -1 as const }], []);
  const options = useMemo(() => ({ state: true, watch: true, limit: 20 }), []);

  const onSelect = useCallback((channel: Channel) => {
    router.push(`/chat/${encodeURIComponent(channel.cid)}` as Href);
  }, []);

  if (!streamUserId) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <EmptyState title="Sign in to view messages" />
      </View>
    );
  }

  if (!ready || !filters) {
    return (
      <View style={[styles.flex, styles.pad, { backgroundColor: colors.background }]}>
        <Text variant="body" muted>
          Connecting to inbox…
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <WithComponents overrides={{ EmptyStateIndicator: InboxEmpty }}>
        <ChannelList
          filters={filters}
          sort={sort}
          options={options}
          onSelect={onSelect}
        />
      </WithComponents>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { padding: spacing.lg, justifyContent: "center" },
});
