import { getEnv } from "../../config/env";
import { getApiClient } from "../client";
import { ApiError } from "../errors";
import { parseServerResponse, type ServerResponse } from "../types";
import type { CurrentUser, ServiceType } from "../../types/auth";

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  firstname: string;
  lastname: string;
  email: string;
  phoneNumber: string;
  password: string;
  /** Agent only */
  serviceType?: ServiceType;
};

export type VerifyTokenRequest = {
  email: string;
  otp: string;
};

export type ResetPasswordRequest = {
  email: string;
  otp: string;
  password: string;
};

export type LoginResult = {
  accessToken: string;
  chatToken: string | null;
  isEmailVerified: boolean;
  user: CurrentUser;
};

function authPrefix(): "users" | "agents" {
  return getEnv().APP_TARGET === "agent" ? "agents" : "users";
}

function assertSuccess<T>(envelope: ServerResponse<T>): ServerResponse<T> {
  if (!envelope.isSuccess) {
    throw new ApiError({
      message: envelope.errorMessage,
      code: "API_ERROR",
      status: envelope.statusCode,
      details: envelope.data,
    });
  }
  return envelope;
}

export function mapCurrentUser(raw: unknown): CurrentUser {
  const u = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const id = String(u._id ?? u.id ?? "");
  const firstname = u.firstname != null ? String(u.firstname) : null;
  const lastname = u.lastname != null ? String(u.lastname) : null;
  const name = [firstname, lastname].filter(Boolean).join(" ") || null;
  const agent = u.agent && typeof u.agent === "object" ? (u.agent as Record<string, unknown>) : null;
  const serviceType = (u.serviceType ?? agent?.serviceType) as ServiceType | undefined;

  return {
    id,
    email: String(u.email ?? ""),
    name,
    phone: u.phoneNumber != null ? String(u.phoneNumber) : null,
    isEmailVerified: Boolean(u.isEmailVerified),
    role: u.role != null ? String(u.role) : u.roles != null ? String(u.roles) : null,
    serviceType: serviceType ?? null,
    agentId: agent?._id != null || agent?.id != null ? String(agent._id ?? agent.id) : null,
    avatarUrl: u.profilePicture != null ? String(u.profilePicture) : null,
    notificationsEnabled:
      u.notificationsEnabled != null ? Boolean(u.notificationsEnabled) : null,
    balance:
      u.balance == null
        ? null
        : typeof u.balance === "number"
          ? u.balance
          : Number(u.balance) || 0,
    kycStatus: parseKycStatus(u.kycStatus ?? agent?.kycStatus),
  };
}

function parseKycStatus(value: unknown): CurrentUser["kycStatus"] {
  if (value == null) return null;
  const raw = String(value).trim().toLowerCase();
  if (raw === "verified" || raw === "approved") return "approved";
  if (raw === "pending") return "pending";
  if (raw === "in_review" || raw === "in-review" || raw === "inreview") {
    return "in_review";
  }
  if (raw === "declined" || raw === "rejected") return "declined";
  return null;
}

function parseLoginData(data: unknown): LoginResult {
  const d = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const isEmailVerified = Boolean(d.isEmailVerified);
  const accessToken = String(d.access_token ?? "");

  // Backend returns access_token: null + isEmailVerified: false for unverified
  // accounts (Flutter checks isEmailVerified first). Do not require a token then.
  if (!accessToken && !isEmailVerified) {
    return {
      accessToken: "",
      chatToken: null,
      isEmailVerified: false,
      user: mapCurrentUser(d.user),
    };
  }

  if (!accessToken) {
    throw new ApiError({
      message: "Missing access token",
      code: "INVALID_LOGIN_PAYLOAD",
      status: 200,
      details: data,
    });
  }
  return {
    accessToken,
    chatToken: d.chatToken != null ? String(d.chatToken) : null,
    isEmailVerified,
    user: mapCurrentUser(d.user),
  };
}

export async function login(body: LoginRequest): Promise<LoginResult> {
  const prefix = authPrefix();
  const res = await getApiClient().post(`/${prefix}/login`, body);
  const envelope = assertSuccess(parseServerResponse(res.data));
  return parseLoginData(envelope.data);
}

export type RegisterResult = {
  otp: string | null;
  emailDelivered: boolean;
};

/** Flutter `CreateAccountController.createAccount` — parses otp / emailDelivered. */
export async function register(body: RegisterRequest): Promise<RegisterResult> {
  const prefix = authPrefix();
  const res = await getApiClient().post(`/${prefix}/register`, body);
  const envelope = assertSuccess(parseServerResponse(res.data));
  const data =
    envelope.data && typeof envelope.data === "object"
      ? (envelope.data as Record<string, unknown>)
      : null;
  return {
    otp: data?.otp != null ? String(data.otp) : null,
    emailDelivered: data?.emailDelivered === true,
  };
}

export async function verifyToken(body: VerifyTokenRequest): Promise<ServerResponse> {
  const prefix = authPrefix();
  const res = await getApiClient().post(`/${prefix}/verify-token`, body);
  return assertSuccess(parseServerResponse(res.data));
}

export type SendTokenResult = {
  otp: string | null;
};

/** Flutter `VerifyCodeController.resendToken` — may include otp in body (user). */
export async function sendToken(email: string): Promise<SendTokenResult> {
  const prefix = authPrefix();
  const res = await getApiClient().post(`/${prefix}/send-token`, { email });
  const envelope = assertSuccess(parseServerResponse(res.data));
  const data =
    envelope.data && typeof envelope.data === "object"
      ? (envelope.data as Record<string, unknown>)
      : null;
  return {
    otp: data?.otp != null ? String(data.otp) : null,
  };
}

export async function requestForgotPassword(email: string): Promise<ServerResponse> {
  const prefix = authPrefix();
  const encoded = encodeURIComponent(email);
  const res = await getApiClient().get(`/${prefix}/request-forgot-password/${encoded}`);
  return assertSuccess(parseServerResponse(res.data));
}

export async function forgotPassword(body: ResetPasswordRequest): Promise<ServerResponse> {
  const prefix = authPrefix();
  const res = await getApiClient().post(`/${prefix}/forgot-password`, body);
  return assertSuccess(parseServerResponse(res.data));
}
