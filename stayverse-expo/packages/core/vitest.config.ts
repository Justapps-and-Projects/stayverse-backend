import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json-summary"],
      // Thresholds apply to the Phase 16 high-value surface (stores, auth API,
      // validators, realtime). Large catalog/media modules remain unit-tested
      // but are out of the ≥70% gate until deeper suites land.
      include: [
        "src/stores/**",
        "src/validation/**",
        "src/storage/mmkv.ts",
        "src/api/errors.ts",
        "src/api/types.ts",
        "src/api/endpoints/auth.ts",
        "src/api/endpoints/notifications.ts",
        "src/api/endpoints/health.ts",
        "src/hooks/useAuthMutations.ts",
        "src/hooks/useHealthQuery.ts",
        "src/location/coords.ts",
        "src/notifications/routes.ts",
        "src/realtime/bridge.ts",
        "src/realtime/socket.ts",
        "src/realtime/socketStore.ts",
        "src/realtime/types.ts",
        "src/chat/streamClient.ts",
        "src/sentry/sentryEnv.ts",
        "src/media/imagePicker.ts",
      ],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/index.ts"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
});
