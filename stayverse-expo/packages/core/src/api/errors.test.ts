import { describe, expect, it } from "vitest";
import { ApiError, isApiError } from "./errors";

describe("ApiError", () => {
  it("stores message code status and details", () => {
    const err = new ApiError({
      message: "Nope",
      code: "API_ERROR",
      status: 400,
      details: { a: 1 },
    });
    expect(err.message).toBe("Nope");
    expect(err.code).toBe("API_ERROR");
    expect(err.status).toBe(400);
    expect(err.details).toEqual({ a: 1 });
    expect(err.name).toBe("ApiError");
    expect(new ApiError({ message: "fallback" }).code).toBe("UNKNOWN");
  });

  it("isApiError narrows unknown errors", () => {
    expect(isApiError(new ApiError({ message: "x", code: "Y" }))).toBe(true);
    expect(isApiError(new Error("x"))).toBe(false);
    expect(isApiError(null)).toBe(false);
  });
});
