import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  getEnv: vi.fn(() => ({
    APP_TARGET: "user",
    GET_STREAM_KEY: "test-key",
    API_BASE_URL: "https://example.com",
  })),
}));

import { getEnv } from "../config/env";
import { getStreamUserId } from "./streamClient";

describe("getStreamUserId", () => {
  beforeEach(() => {
    vi.mocked(getEnv).mockReturnValue({
      APP_TARGET: "user",
      GET_STREAM_KEY: "test-key",
      API_BASE_URL: "https://example.com",
    } as ReturnType<typeof getEnv>);
  });

  it("uses user.id for user app", () => {
    expect(
      getStreamUserId({
        id: "user-1",
        email: "a@b.com",
        agentId: "agent-should-ignore",
      }),
    ).toBe("user-1");
  });

  it("uses agentId for agent app", () => {
    vi.mocked(getEnv).mockReturnValue({
      APP_TARGET: "agent",
      GET_STREAM_KEY: "test-key",
      API_BASE_URL: "https://example.com",
    } as ReturnType<typeof getEnv>);
    expect(
      getStreamUserId({
        id: "parent-user",
        email: "a@b.com",
        agentId: "agent-9",
      }),
    ).toBe("agent-9");
  });
});
