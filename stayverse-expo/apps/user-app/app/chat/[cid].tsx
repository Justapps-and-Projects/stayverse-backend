import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  Channel,
  MessageComposer,
  MessageContent,
  MessageList,
  useMessageContext,
  WithComponents,
  type MessageContentProps,
} from "stream-chat-expo";
import type { Channel as StreamChannel } from "stream-chat";
import {
  getStreamClient,
  ProposalMessageCard,
  useStreamUiStore,
} from "@stayverse/core";
import { Text, spacing, useTheme } from "@stayverse/ui";

function CustomMessageContent(props: MessageContentProps) {
  const { message } = useMessageContext();
  const extra = (message ?? {}) as Record<string, unknown>;
  const isProposal = extra.extraDataType === "proposal";

  if (isProposal) {
    return (
      <ProposalMessageCard
        extra={{
          extraDataType: "proposal",
          id: extra.id != null ? String(extra.id) : undefined,
          price: typeof extra.price === "number" ? extra.price : undefined,
          currency: extra.currency != null ? String(extra.currency) : undefined,
          status: extra.status != null ? String(extra.status) : undefined,
          description:
            extra.description != null
              ? String(extra.description)
              : message?.text,
          proposalEndDate:
            extra.proposalEndDate != null
              ? String(extra.proposalEndDate)
              : undefined,
        }}
      />
    );
  }

  return <MessageContent {...props} />;
}

export default function ChatChannelScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const ready = useStreamUiStore((s) => s.ready);
  const params = useLocalSearchParams<{ cid: string }>();
  const cid = useMemo(() => {
    const raw = params.cid;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return value ? decodeURIComponent(value) : "";
  }, [params.cid]);

  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !cid) return;
    let cancelled = false;

    const run = async () => {
      try {
        const client = getStreamClient();
        const [type, ...idParts] = cid.split(":");
        const id = idParts.join(":");
        if (!type || !id) {
          throw new Error(`Invalid channel cid: ${cid}`);
        }
        const ch = client.channel(type, id);
        await ch.watch();
        if (!cancelled) setChannel(ch);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to open chat");
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [cid, ready]);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Chat",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.back}>
              <Text variant="bodyBold" style={{ color: colors.primary }}>
                Back
              </Text>
            </Pressable>
          ),
        }}
      />

      {!ready || (!channel && !error) ? (
        <View style={styles.center}>
          <ActivityIndicator color="#FBC036" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text variant="body" muted>
            {error}
          </Text>
        </View>
      ) : channel ? (
        <WithComponents overrides={{ MessageContent: CustomMessageContent }}>
          <Channel channel={channel}>
            <MessageList />
            <MessageComposer />
          </Channel>
        </WithComponents>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  back: { paddingHorizontal: spacing.md },
});
