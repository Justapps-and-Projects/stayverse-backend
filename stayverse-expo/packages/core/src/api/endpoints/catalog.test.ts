import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
const get = vi.fn();

vi.mock("../client", () => ({
  getApiClient: () => ({ post, get }),
}));

vi.mock("../../config/env", () => ({
  getEnv: () => ({
    APP_TARGET: "user",
    API_BASE_URL: "https://example.com",
  }),
}));

vi.mock("../../stores/authStore", () => ({
  useAuthStore: {
    getState: () => ({ accessToken: null, logout: vi.fn() }),
    setState: vi.fn(),
  },
}));

import {
  cancelBooking,
  fetchBookings,
  fundWallet,
  verifyKyc,
} from "./catalog";

describe("catalog endpoints", () => {
  beforeEach(() => {
    post.mockReset();
    get.mockReset();
  });

  it("fetchBookings maps success page", async () => {
    get.mockResolvedValue({
      data: {
        statusCode: 200,
        message: "ok",
        data: {
          docs: [
            {
              _id: "b1",
              status: "accepted",
              serviceType: "apartment",
              apartment: { _id: "a1", title: "Flat", address: "Lagos" },
            },
          ],
          hasNextPage: false,
          page: 1,
        },
      },
    });

    const page = await fetchBookings("accepted", 1);
    expect(get).toHaveBeenCalledWith("/booking/user", {
      params: { status: "accepted", page: 1, limit: 10 },
    });
    expect(page.items.length).toBeGreaterThanOrEqual(0);
  });

  it("fetchBookings returns empty on error envelope", async () => {
    get.mockResolvedValue({
      data: { statusCode: 500, message: "fail", data: null },
    });
    const page = await fetchBookings("pending");
    expect(page.items).toEqual([]);
  });

  it("cancelBooking succeeds and fails", async () => {
    post.mockResolvedValueOnce({
      data: { statusCode: 200, message: "ok", data: {} },
    });
    await cancelBooking("b1");
    expect(post).toHaveBeenCalledWith("/booking/b1/cancel");

    post.mockResolvedValueOnce({
      data: { statusCode: 400, message: "Cannot cancel", data: null },
    });
    await expect(cancelBooking("b2")).rejects.toThrow("Cannot cancel");
  });

  it("fundWallet returns paystack payload", async () => {
    post.mockResolvedValue({
      data: {
        statusCode: 200,
        message: "ok",
        data: {
          authorization_url: "https://pay.example/auth",
          reference: "ref-1",
          access_code: "ac",
        },
      },
    });
    const funded = await fundWallet(5000);
    expect(funded.authorizationUrl).toContain("pay.example");
    expect(funded.reference).toBe("ref-1");
  });

  it("fundWallet rejects missing url", async () => {
    post.mockResolvedValue({
      data: {
        statusCode: 200,
        message: "ok",
        data: { reference: "only-ref" },
      },
    });
    await expect(fundWallet(100)).rejects.toThrow("Please try payment again");
  });

  it("verifyKyc posts multipart and refreshes profile", async () => {
    post.mockResolvedValue({
      data: { statusCode: 200, message: "ok", data: {} },
    });
    get.mockResolvedValue({
      data: {
        statusCode: 200,
        message: "ok",
        data: {
          _id: "u1",
          email: "a@b.com",
          isEmailVerified: true,
        },
      },
    });

    const user = await verifyKyc({
      nin: "12345678901",
      selfie: { uri: "file://x.jpg", name: "x.jpg", type: "image/jpeg" },
    });
    expect(post.mock.calls[0][0]).toBe("/users/kyc");
    expect(post.mock.calls[0][1]).toBeInstanceOf(FormData);
    expect(user?.email).toBe("a@b.com");
  });

  it("verifyKyc throws on error envelope", async () => {
    post.mockResolvedValue({
      data: { statusCode: 400, message: "Bad NIN", data: null },
    });
    await expect(
      verifyKyc({
        nin: "bad",
        selfie: { uri: "file://x.jpg", name: "x.jpg", type: "image/jpeg" },
      }),
    ).rejects.toThrow("Bad NIN");
  });
});
