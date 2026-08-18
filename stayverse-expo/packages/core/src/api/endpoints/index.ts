/**
 * Domain endpoint modules — expand as features migrate.
 * Auth + health are wired in Phase 4; others are stubs mirroring Flutter domains.
 */
export * as authApi from "./auth";
export * as healthApi from "./health";
export * as notificationsApi from "./notifications";

/** Placeholder exports for upcoming domains (Phase 5+) */
export const bookingsApi = {} as const;
export const agentsApi = {} as const;
export const paymentsApi = {} as const;
export const chatApi = {} as const;
