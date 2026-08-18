import { describe, expect, it } from "vitest";
import { sentryEnvironmentTag } from "./sentryEnv";

describe("sentryEnvironmentTag", () => {
  it("maps APP_ENV to Flutter-style uppercase tags", () => {
    expect(sentryEnvironmentTag("development")).toBe("DEV");
    expect(sentryEnvironmentTag("staging")).toBe("STAGING");
    expect(sentryEnvironmentTag("production")).toBe("PROD");
  });
});
