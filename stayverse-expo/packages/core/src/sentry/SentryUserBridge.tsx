import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { setStayverseSentryUser } from "./sentry";

/** Sync auth user → Sentry user context (Flutter used deviceId; we prefer account id). */
export function SentryUserBridge() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user?.id) {
      setStayverseSentryUser(null);
      return;
    }
    setStayverseSentryUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  }, [user?.id, user?.email, user?.name]);

  return null;
}
