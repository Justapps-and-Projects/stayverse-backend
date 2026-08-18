import { useMutation } from "@tanstack/react-query";
import {
  forgotPassword,
  login,
  register,
  requestForgotPassword,
  sendToken,
  verifyToken,
  type LoginRequest,
  type LoginResult,
  type RegisterRequest,
  type ResetPasswordRequest,
  type VerifyTokenRequest,
} from "../api/endpoints/auth";
import { useAuthStore } from "../stores/authStore";
import { ApiError } from "../api/errors";

export function useLoginMutation() {
  const loginAction = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: async (body: LoginRequest): Promise<LoginResult> => {
      const result = await login(body);
      if (!result.isEmailVerified) {
        throw new ApiError({
          message: "Email not verified",
          code: "EMAIL_NOT_VERIFIED",
          status: 200,
          details: result,
        });
      }
      loginAction({
        user: result.user,
        accessToken: result.accessToken,
        chatToken: result.chatToken,
        serviceType: result.user.serviceType,
      });
      return result;
    },
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (body: RegisterRequest) => register(body),
  });
}

export function useVerifyTokenMutation() {
  return useMutation({
    mutationFn: (body: VerifyTokenRequest) => verifyToken(body),
  });
}

export function useSendTokenMutation() {
  return useMutation({
    mutationFn: (email: string) => sendToken(email),
  });
}

export function useRequestForgotPasswordMutation() {
  return useMutation({
    mutationFn: (email: string) => requestForgotPassword(email),
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (body: ResetPasswordRequest) => forgotPassword(body),
  });
}
