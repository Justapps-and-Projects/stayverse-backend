import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query/keys";
import { socketListen } from "./events";
import type { LocationUpdatePayload } from "./types";

export type LiveLocationCache = LocationUpdatePayload & { updatedAt: number };

/**
 * Bridge Flutter socket listeners into React Query cache.
 * Chat realtime in production is Stream Chat (Phase later); these BrimChat
 * events still invalidate a local chat ping key if/when that namespace connects.
 */
export function bindSocketQueryBridge(queryClient: QueryClient): () => void {
  const unsubs: Array<() => void> = [];

  unsubs.push(
    socketListen.onLocationUpdated((payload) => {
      const value: LiveLocationCache = { ...payload, updatedAt: Date.now() };
      queryClient.setQueryData(queryKeys.liveLocation, value);
    }),
  );

  unsubs.push(
    socketListen.onChatMessageNew(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatPing });
    }),
  );

  unsubs.push(
    socketListen.onChatMessageDeleted(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatPing });
    }),
  );

  unsubs.push(
    socketListen.onChatMessageRead(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatPing });
    }),
  );

  return () => {
    unsubs.forEach((u) => u());
  };
}
