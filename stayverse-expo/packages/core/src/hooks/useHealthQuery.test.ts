import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useHealthQuery } from "../hooks/useHealthQuery";

vi.mock("../api/endpoints/health", () => ({
  fetchHealth: vi.fn(async () => ({
    statusCode: 200,
    message: "Request successful",
    data: { status: "ok", service: "stayverse-backend" },
  })),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return React.createElement(QueryClientProvider, { client }, children);
}

describe("useHealthQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads mocked health payload", async () => {
    const { result } = renderHook(() => useHealthQuery(true), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({
      data: { status: "ok" },
    });
  });
});
