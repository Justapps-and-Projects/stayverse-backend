import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
const get = vi.fn();
let appTarget: "user" | "agent" = "user";

vi.mock("../client", () => ({
  getApiClient: () => ({ post, get }),
}));

vi.mock("../../config/env", () => ({
  getEnv: () => ({
    APP_TARGET: appTarget,
    API_BASE_URL: "https://example.com",
  }),
}));

import { forgotPassword, login, requestForgotPassword } from "./auth";

describe("auth login", () => {
  beforeEach(() => {
    post.mockReset();
    get.mockReset();
    appTarget = "user";
  });

  it("uses agent-specific endpoints for sign in and password reset", async () => {
    appTarget = "agent";
    post.mockResolvedValue({
      data: { statusCode: 200, message: "ok", data: {} },
    });
    get.mockResolvedValue({
      data: { statusCode: 200, message: "OTP sent", data: null },
    });

    await login({ email: "agent+test@example.com", password: "SecurePass123!" });
    await requestForgotPassword("agent+test@example.com");
    await forgotPassword({
      email: "agent+test@example.com",
      otp: "123456",
      password: "SecurePass123!",
    });

    expect(get).toHaveBeenCalledWith(
      "/agents/request-forgot-password/agent%2Btest%40example.com",
    );
    expect(post).toHaveBeenCalledWith("/agents/login", {
      email: "agent+test@example.com",
      password: "SecurePass123!",
    });
    expect(post).toHaveBeenCalledWith("/agents/forgot-password", {
      email: "agent+test@example.com",
      otp: "123456",
      password: "SecurePass123!",
    });
  });

  it("returns tokens and user on success", async () => {
    post.mockResolvedValue({
      data: {
        statusCode: 200,
        message: "ok",
        data: {
          access_token: "tok",
          chatToken: "chat",
          isEmailVerified: true,
          user: {
            _id: "u1",
            email: "a@b.com",
            firstname: "A",
            lastname: "B",
            isEmailVerified: true,
          },
        },
      },
    });

    const result = await login({ email: "a@b.com", password: "secret" });
    expect(post).toHaveBeenCalledWith("/users/login", {
      email: "a@b.com",
      password: "secret",
    });
    expect(result.accessToken).toBe("tok");
    expect(result.user.email).toBe("a@b.com");
  });

  it("throws on error envelope", async () => {
    post.mockResolvedValue({
      data: {
        statusCode: 400,
        message: "Invalid credentials",
        data: null,
      },
    });

    await expect(
      login({ email: "a@b.com", password: "bad" }),
    ).rejects.toThrow("Invalid credentials");
  });

  it("allows unverified login with null access_token (OTP flow)", async () => {
    post.mockResolvedValue({
      data: {
        statusCode: 200,
        message: "ok",
        data: {
          access_token: null,
          isEmailVerified: false,
          user: null,
        },
      },
    });

    const result = await login({ email: "a@b.com", password: "secret" });
    expect(result.accessToken).toBe("");
    expect(result.isEmailVerified).toBe(false);
  });
});
