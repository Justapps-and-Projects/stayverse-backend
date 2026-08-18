/**
 * Mirrors Flutter `ServerResponse` envelope: `{ statusCode, message, data }`.
 */
export type ServerResponse<T = unknown> = {
  statusCode: number | null;
  message: string | null;
  data: T;
  isSuccess: boolean;
  errorMessage: string;
  payload: unknown;
};

export function parseServerResponse<T = unknown>(json: unknown): ServerResponse<T> {
  if (!json || typeof json !== "object") {
    return {
      statusCode: null,
      message: null,
      data: json as T,
      isSuccess: false,
      errorMessage: "Please try again",
      payload: json,
    };
  }

  const record = json as Record<string, unknown>;
  const statusCode =
    typeof record.statusCode === "number"
      ? record.statusCode
      : typeof record.status === "number"
        ? record.status
        : null;
  const message = typeof record.message === "string" ? record.message : null;
  const isSuccess = statusCode != null && statusCode >= 200 && statusCode < 300;

  return {
    statusCode,
    message,
    data: record.data as T,
    isSuccess,
    errorMessage: message ?? "Please try again",
    payload: json,
  };
}
