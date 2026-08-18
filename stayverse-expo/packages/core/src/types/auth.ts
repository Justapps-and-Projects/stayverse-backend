export type ServiceType = "chef" | "apartment" | "ride";

/** Flutter `KycVerificationStatus`. */
export type KycStatus = "pending" | "in_review" | "approved" | "declined";

export type CurrentUser = {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  isEmailVerified?: boolean;
  role?: string | null;
  /** Agent apps only */
  serviceType?: ServiceType | null;
  /** Nested agent profile id — Stream Chat connect id for agent app */
  agentId?: string | null;
  avatarUrl?: string | null;
  /** Flutter `notificationsEnabled` — drives device-token `enable` flag */
  notificationsEnabled?: boolean | null;
  /** Wallet balance from `GET /users/me` */
  balance?: number | null;
  /** Flutter `kycStatus` */
  kycStatus?: KycStatus | null;
};
