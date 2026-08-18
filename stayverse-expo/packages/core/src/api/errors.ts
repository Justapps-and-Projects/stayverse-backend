export class ApiError extends Error {
  readonly code: string;
  readonly status: number | null;
  readonly details: unknown;

  constructor(input: {
    message: string;
    code?: string;
    status?: number | null;
    details?: unknown;
  }) {
    super(input.message);
    this.name = "ApiError";
    this.code = input.code ?? "UNKNOWN";
    this.status = input.status ?? null;
    this.details = input.details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
