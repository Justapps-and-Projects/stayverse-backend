import { getApiClient } from "../client";

/**
 * Backend warm-up / liveness — Flutter calls GET `/health` on boot.
 */
export async function fetchHealth(): Promise<unknown> {
  const res = await getApiClient().get("/health");
  return res.data;
}

export async function fetchTestLog(): Promise<unknown> {
  const res = await getApiClient().get("/test-log");
  return res.data;
}
