import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { secureStorage } from "../storage/secureStorage";
import type { CurrentUser, ServiceType } from "../types/auth";

export type AuthState = {
  user: CurrentUser | null;
  accessToken: string | null;
  chatToken: string | null;
  serviceType: ServiceType | null;
  isAuthenticated: boolean;
  /** False until persist rehydration finishes */
  isHydrated: boolean;
  isLoading: boolean;
  login: (input: {
    user: CurrentUser;
    accessToken: string;
    chatToken?: string | null;
    serviceType?: ServiceType | null;
  }) => void;
  logout: () => void;
  setUser: (user: CurrentUser | null) => void;
  /** Local overwrite only — Flutter has no refresh API */
  refreshToken: (accessToken: string) => void;
  setServiceType: (serviceType: ServiceType | null) => void;
  setAuthenticated: (value: boolean) => void;
  setHydrated: (value: boolean) => void;
};

const initialSession = {
  user: null as CurrentUser | null,
  accessToken: null as string | null,
  chatToken: null as string | null,
  serviceType: null as ServiceType | null,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialSession,
      isHydrated: false,
      isLoading: true,
      login: ({ user, accessToken, chatToken = null, serviceType = null }) => {
        set({
          user,
          accessToken,
          chatToken,
          serviceType: serviceType ?? user.serviceType ?? null,
          isAuthenticated: true,
          isLoading: false,
        });
      },
      logout: () => {
        set({
          ...initialSession,
          isLoading: false,
          isHydrated: true,
        });
      },
      setUser: (user) => {
        set((state) => ({
          user,
          isAuthenticated: !!user && !!state.accessToken,
        }));
      },
      refreshToken: (accessToken) => {
        set({ accessToken });
      },
      setServiceType: (serviceType) => {
        set({ serviceType });
      },
      setAuthenticated: (value) => {
        set({ isAuthenticated: value });
      },
      setHydrated: (value) => {
        set({ isHydrated: value, isLoading: !value });
      },
    }),
    {
      name: "stayverse-auth",
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        chatToken: state.chatToken,
        serviceType: state.serviceType,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          useAuthStore.setState({
            isHydrated: true,
            isLoading: false,
            isAuthenticated: false,
          });
          return;
        }
        const authenticated = !!(state?.accessToken && state?.user);
        useAuthStore.setState({
          isHydrated: true,
          isLoading: false,
          isAuthenticated: authenticated,
        });
      },
    },
  ),
);

/** Never leave AuthGate spinning if SecureStore rehydration stalls. */
const AUTH_HYDRATION_TIMEOUT_MS = 3000;
setTimeout(() => {
  if (!useAuthStore.getState().isHydrated) {
    useAuthStore.setState({ isHydrated: true, isLoading: false });
  }
}, AUTH_HYDRATION_TIMEOUT_MS);

useAuthStore.persist.onFinishHydration(() => {
  if (!useAuthStore.getState().isHydrated) {
    const { accessToken, user } = useAuthStore.getState();
    useAuthStore.setState({
      isHydrated: true,
      isLoading: false,
      isAuthenticated: !!(accessToken && user),
    });
  }
});

/** Dev helper — mock session for AuthGate QA */
export function forceDevLogin(overrides?: Partial<CurrentUser> & { serviceType?: ServiceType }) {
  const serviceType = overrides?.serviceType ?? null;
  useAuthStore.getState().login({
    accessToken: "dev-access-token",
    chatToken: "dev-chat-token",
    serviceType,
    user: {
      id: "dev-user",
      email: overrides?.email ?? "dev@stayverse.com",
      name: overrides?.name ?? "Dev User",
      isEmailVerified: true,
      role: overrides?.role ?? "user",
      serviceType,
      ...overrides,
    },
  });
}
