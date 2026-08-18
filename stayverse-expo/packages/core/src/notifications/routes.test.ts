import { describe, expect, it } from "vitest";
import {
  foregroundToastFromMessage,
  resolveNotificationHref,
} from "./routes";

describe("notification routes", () => {
  it("maps curated_message to inbox", () => {
    expect(resolveNotificationHref({ type: "curated_message" }, "user")).toBe(
      "/(tabs)/inbox",
    );
  });

  it("maps Stream channel cid to chat route", () => {
    expect(
      resolveNotificationHref(
        { channel_type: "messaging", channel_id: "!members-abc" },
        "user",
      ),
    ).toBe(`/chat/${encodeURIComponent("messaging:!members-abc")}`);
  });

  it("maps bookingId by app target", () => {
    expect(resolveNotificationHref({ bookingId: "b1" }, "user")).toBe(
      "/(tabs)/bookings",
    );
    expect(resolveNotificationHref({ bookingId: "b1" }, "agent")).toBe(
      "/(tabs)/inbox",
    );
  });

  it("maps escrow to wallet for agents", () => {
    expect(resolveNotificationHref({ escrowId: "e1" }, "agent")).toBe(
      "/(tabs)/wallet",
    );
  });

  it("builds curated foreground toast copy like Flutter", () => {
    expect(
      foregroundToastFromMessage({
        title: "Hello",
        body: "World",
        data: { type: "curated_message" },
      }),
    ).toEqual({ title: "Hello", message: "World" });

    expect(
      foregroundToastFromMessage({
        title: "",
        body: "",
        data: { type: "curated_message" },
      }),
    ).toBeNull();
  });
});
