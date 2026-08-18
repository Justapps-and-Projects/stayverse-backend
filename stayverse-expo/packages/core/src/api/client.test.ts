import { beforeEach, describe, expect, it, vi } from "vitest";

const logout = vi.fn();
const mockAccessToken = { current: "tok-1" as string | null };

vi.mock("../stores/authStore", () => ({
  useAuthStore: {
    getState: () => ({
      accessToken: mockAccessToken.current,
      logout,
    }),
  },
}));

vi.mock("../config/env", () => ({
  getEnv: () => ({
    APP_TARGET: "user",
    API_BASE_URL: "https://api.example.com",
  }),
}));

vi.mock("../sentry/sentry", () => ({
  addStayverseBreadcrumb: vi.fn(),
}));

type Handler = (value: unknown) => unknown | Promise<unknown>;

const requestHandlers: Handler[] = [];
const responseHandlers: Array<{
  onFulfilled?: Handler;
  onRejected?: Handler;
}> = [];

const mockRequest = vi.fn();

vi.mock("axios", () => {
  const create = vi.fn(() => ({
    interceptors: {
      request: {
        use: (fn: Handler) => {
          requestHandlers.push(fn);
        },
      },
      response: {
        use: (onFulfilled?: Handler, onRejected?: Handler) => {
          responseHandlers.push({ onFulfilled, onRejected });
        },
      },
    },
    request: mockRequest,
  }));
  return {
    default: { create },
    __esModule: true,
  };
});

describe("api client", () => {
  beforeEach(async () => {
    requestHandlers.length = 0;
    responseHandlers.length = 0;
    mockRequest.mockReset();
    logout.mockReset();
    mockAccessToken.current = "tok-1";
    vi.resetModules();
    const { resetApiClient, getApiClient } = await import("./client");
    resetApiClient();
    getApiClient();
  });

  it("attaches Bearer token on requests", async () => {
    const config = {
      headers: {} as Record<string, unknown>,
      method: "get",
      url: "/x",
      baseURL: "https://api.example.com",
      data: undefined,
    };
    const next = await requestHandlers[0](config);
    expect((next as typeof config).headers.Authorization).toBe("Bearer tok-1");
  });

  it("strips Content-Type for FormData bodies", async () => {
    const form = new FormData();
    form.append("a", "b");
    const config = {
      headers: { "Content-Type": "application/json" } as Record<string, unknown>,
      method: "post",
      url: "/kyc",
      baseURL: "https://api.example.com",
      data: form,
    };
    const next = await requestHandlers[0](config);
    expect((next as typeof config).headers["Content-Type"]).toBeUndefined();
  });

  it("logs out when 401 refresh fails", async () => {
    const config = {
      headers: {} as Record<string, unknown>,
      method: "get",
      url: "/secure",
      _retry: false,
    };
    const response = {
      status: 401,
      data: { message: "expired" },
      config,
    };

    await expect(
      responseHandlers[0].onFulfilled?.(response),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(logout).toHaveBeenCalled();
  });
});
