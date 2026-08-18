import { beforeEach, describe, expect, it } from "vitest";
import { useChatUiStore } from "./chatUiStore";

describe("useChatUiStore", () => {
  beforeEach(() => {
    useChatUiStore.getState().reset();
  });

  it("tracks busy and active channel", () => {
    useChatUiStore.getState().setBusy(true);
    useChatUiStore.getState().setActiveChannelId("c1");
    expect(useChatUiStore.getState()).toMatchObject({
      isBusy: true,
      activeChannelId: "c1",
    });
    useChatUiStore.getState().reset();
    expect(useChatUiStore.getState().activeChannelId).toBeNull();
  });
});
