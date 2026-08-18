import { getApiClient } from "../client";
import { getEnv } from "../../config/env";

export type RegisterDeviceTokenInput = {
  deviceToken: string;
  enable: boolean;
};

/**
 * Flutter `BrimPusher.pushToken`:
 * - user:  PATCH /users/notifications/device-token
 * - agent: PATCH /agents/notifications/device-token
 * body: { deviceToken, enable }
 */
export async function registerDeviceToken({
  deviceToken,
  enable,
}: RegisterDeviceTokenInput): Promise<void> {
  const prefix = getEnv().APP_TARGET === "agent" ? "/agents" : "/users";
  await getApiClient().patch(`${prefix}/notifications/device-token`, {
    deviceToken,
    enable,
  });
}
