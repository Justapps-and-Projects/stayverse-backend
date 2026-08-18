import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { getEnv } from "../config/env";
import { useAuthStore } from "../stores/authStore";
import { ApiError } from "./errors";
import { parseServerResponse } from "./types";
import { addStayverseBreadcrumb } from "../sentry/sentry";

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let client: AxiosInstance | null = null;
let refreshPromise: Promise<boolean> | null = null;

function truncate(value: unknown, max = 500): string {
  try {
    const raw = typeof value === "string" ? value : JSON.stringify(value);
    if (!raw) return "";
    return raw.length > max ? `${raw.slice(0, max)}…` : raw;
  } catch {
    return "[unserializable]";
  }
}

function logDev(
  phase: "req" | "res" | "err",
  info: Record<string, unknown>,
) {
  if (typeof __DEV__ !== "undefined" && !__DEV__) return;
  console.log(`[api:${phase}]`, info);
}

/**
 * Stayverse has no refresh-token API today (Flutter only overwrote the stored JWT).
 * This hook is the extension point — returns false → interceptor logs out.
 */
async function attemptTokenRefresh(): Promise<boolean> {
  // No backend `/refresh` endpoint in Flutter apps.
  return false;
}

function toApiError(error: AxiosError): ApiError {
  const status = error.response?.status ?? null;
  const data = error.response?.data;
  if (data && typeof data === "object") {
    const envelope = parseServerResponse(data);
    return new ApiError({
      message: envelope.errorMessage || error.message || "Request failed",
      code: status === 401 ? "UNAUTHORIZED" : "HTTP_ERROR",
      status: envelope.statusCode ?? status,
      details: envelope.data ?? data,
    });
  }
  return new ApiError({
    message: error.message || "Network error",
    code: error.code ?? "NETWORK_ERROR",
    status,
    details: data,
  });
}

function createClient(): AxiosInstance {
  const env = getEnv();
  const instance = axios.create({
    baseURL: env.API_BASE_URL,
    // Render free-tier cold starts can take ~30–50s; keep headroom without hanging forever.
    timeout: 60_000,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": `Stayverse/${env.APP_TARGET}`,
    },
    validateStatus: (status) => status < 600,
  });

  instance.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let axios/RN set multipart boundary when posting FormData.
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (config.headers && typeof config.headers === "object") {
        delete (config.headers as Record<string, unknown>)["Content-Type"];
      }
    }
    (config as RetriableConfig & { _startedAt?: number })._startedAt = Date.now();
    logDev("req", {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL ?? ""}${config.url ?? ""}`,
      body: truncate(config.data),
    });
    return config;
  });

  instance.interceptors.response.use(
    async (response: AxiosResponse) => {
      const started = (response.config as RetriableConfig & { _startedAt?: number })._startedAt;
      const duration = started ? Date.now() - started : undefined;
      logDev("res", {
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        status: response.status,
        duration,
        body: truncate(response.data),
      });

      // Treat Stayverse envelope non-2xx statusCode as errors when HTTP is 200
      if (
        response.data &&
        typeof response.data === "object" &&
        "statusCode" in (response.data as object)
      ) {
        const envelope = parseServerResponse(response.data);
        if (!envelope.isSuccess && response.status < 500) {
          // Still return; callers check isSuccess. HTTP 401 handled below.
        }
      }

      if (response.status === 401) {
        return handleUnauthorized(instance, response.config as RetriableConfig, response);
      }

      if (response.status >= 400) {
        addStayverseBreadcrumb(
          `API ${response.config.method?.toUpperCase() ?? "?"} ${response.config.url} → ${response.status}`,
          "http",
          {
            method: response.config.method,
            url: response.config.url,
            status: response.status,
            body: truncate(response.data, 200),
          },
          "error",
        );
        throw toApiError({
          isAxiosError: true,
          name: "AxiosError",
          message: `Request failed with status ${response.status}`,
          response,
          config: response.config,
          toJSON: () => ({}),
        } as AxiosError);
      }

      return response;
    },
    async (error: AxiosError) => {
      logDev("err", {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        status: error.response?.status,
        message: error.message,
        body: truncate(error.response?.data),
      });

      addStayverseBreadcrumb(
        `API error ${error.config?.method?.toUpperCase() ?? "?"} ${error.config?.url ?? ""} — ${error.message}`,
        "http",
        {
          method: error.config?.method,
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
        },
        "error",
      );

      if (error.response?.status === 401 && error.config) {
        return handleUnauthorized(instance, error.config as RetriableConfig, error.response);
      }

      throw toApiError(error);
    },
  );

  return instance;
}

async function handleUnauthorized(
  instance: AxiosInstance,
  config: RetriableConfig,
  responseOrNull: AxiosResponse | undefined,
): Promise<AxiosResponse> {
  if (config._retry) {
    useAuthStore.getState().logout();
    throw new ApiError({
      message: "Session expired",
      code: "UNAUTHORIZED",
      status: 401,
      details: responseOrNull?.data,
    });
  }

  config._retry = true;

  if (!refreshPromise) {
    refreshPromise = attemptTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  const ok = await refreshPromise;
  if (!ok) {
    useAuthStore.getState().logout();
    throw new ApiError({
      message: "Session expired",
      code: "UNAUTHORIZED",
      status: 401,
      details: responseOrNull?.data,
    });
  }

  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return instance.request(config);
}

export function getApiClient(): AxiosInstance {
  if (!client) {
    client = createClient();
  }
  return client;
}

/** Rebuild client after env change (tests / hot reload). */
export function resetApiClient() {
  client = null;
}
