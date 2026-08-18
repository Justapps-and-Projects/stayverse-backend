import { StreamChat, type Channel, type UserResponse } from "stream-chat";
import { getEnv } from "../config/env";
import type { CurrentUser } from "../types/auth";

let client: StreamChat | null = null;
let connectedUserId: string | null = null;

function log(...args: unknown[]) {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log("[stream]", ...args);
  }
}

/**
 * Flutter Stream user id:
 * - user app → User._id
 * - agent app → Agent._id (`agentId`)
 */
export function getStreamUserId(user: CurrentUser | null | undefined): string | null {
  if (!user?.id) return null;
  if (getEnv().APP_TARGET === "agent") {
    return user.agentId || user.id;
  }
  return user.id;
}

export function getStreamClient(): StreamChat {
  if (client) return client;
  const apiKey = getEnv().GET_STREAM_KEY;
  if (!apiKey) {
    log("GET_STREAM_KEY missing — client created with empty key (connect will fail)");
  }
  client = StreamChat.getInstance(apiKey || "missing-stream-key");
  return client;
}

export function isStreamConnected(): boolean {
  return !!connectedUserId && getStreamClient().userID === connectedUserId;
}

export async function connectStreamUser(input: {
  user: CurrentUser;
  chatToken: string;
}): Promise<void> {
  const id = getStreamUserId(input.user);
  if (!id || !input.chatToken) {
    log("skip connect — missing id or chatToken");
    return;
  }

  const c = getStreamClient();
  if (connectedUserId === id && c.userID === id) {
    log("already connected", id);
    return;
  }

  if (c.userID && c.userID !== id) {
    await disconnectStreamUser();
  }

  const userData: UserResponse = {
    id,
    name: input.user.name ?? undefined,
    image: input.user.avatarUrl ?? undefined,
  };

  await c.connectUser(userData, input.chatToken);
  connectedUserId = id;
  log("connected", id);
}

export async function disconnectStreamUser(): Promise<void> {
  const c = client;
  if (!c) {
    connectedUserId = null;
    return;
  }
  try {
    if (c.userID) {
      await c.disconnectUser();
      log("disconnected");
    }
  } catch (e) {
    log("disconnect error", e);
  } finally {
    connectedUserId = null;
  }
}

/** Flutter `PushProvider.firebase` + `pushProviderName: 'Stayverse'` */
export async function addStreamPushDevice(deviceToken: string): Promise<void> {
  const c = getStreamClient();
  if (!c.userID || !deviceToken) return;
  try {
    await c.addDevice(deviceToken, "firebase", undefined, "Stayverse");
    log("addDevice Stayverse");
  } catch (e) {
    log("addDevice failed", e);
  }
}

/**
 * Flutter `CommnunicationSevice` — distinct messaging channel from members.
 * Channel id omitted → Stream `!members-*` id.
 */
export function createMessagingChannel(memberIds: string[], title = ""): Channel {
  const c = getStreamClient();
  // Distinct channel — id omitted; members define the channel (Flutter parity).
  // `agent` is Flutter custom extraData (not in ChannelData typings).
  return c.channel("messaging", undefined, {
    members: memberIds,
    agent: { title },
  } as never);
}

export async function watchMessagingChannel(
  memberIds: string[],
  title = "",
): Promise<Channel> {
  const channel = createMessagingChannel(memberIds, title);
  await channel.watch();
  return channel;
}

/** Vitest helper */
export function __resetStreamClientForTests(): void {
  client = null;
  connectedUserId = null;
}
