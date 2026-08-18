import { beforeEach, describe, expect, it, vi } from "vitest";

const patch = vi.fn().mockResolvedValue({ status: 200, data: {} });

vi.mock("../client", () => ({
  getApiClient: () => ({ patch }),
}));

vi.mock("../../config/env", () => ({
  getEnv: () => ({
    APP_TARGET: "user",
    API_BASE_URL: "https://example.com",
  }),
}));

import { registerDeviceToken } from "./notifications";

describe("registerDeviceToken", () => {
  beforeEach(() => {
    patch.mockClear();
  });

  it("PATCHes Flutter device-token path with body shape", async () => {
    await registerDeviceToken({ deviceToken: "fcm-1", enable: true });
    expect(patch).toHaveBeenCalledWith("/users/notifications/device-token", {
      deviceToken: "fcm-1",
      enable: true,
    });
  });
});
