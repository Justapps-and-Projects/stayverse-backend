type ListPayload<T> =
  | T[]
  | {
      apartments?: T[];
      rides?: T[];
      chefs?: T[];
      data?: T[];
      docs?: T[];
      items?: T[];
    };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function firstImage(value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const first = value[0];
  return typeof first === "string" && first.trim() ? first : null;
}

export function extractTypedList<T>(
  payload: ListPayload<T> | null | undefined,
  key: "apartments" | "rides" | "chefs",
): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const record = payload as Record<string, unknown>;
  const keyed = record[key];
  if (Array.isArray(keyed)) return keyed as T[];

  for (const fallback of ["data", "docs", "items"] as const) {
    const list = record[fallback];
    if (Array.isArray(list)) return list as T[];
  }

  return [];
}

export function unwrapCatalogData(payload: unknown): unknown {
  const record = asRecord(payload);
  if (!record) return payload;
  return record.data ?? payload;
}

export function readString(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

export function readId(raw: Record<string, unknown>): string {
  return String(raw._id ?? raw.id ?? "");
}

export function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export function readListingImage(raw: Record<string, unknown>): string | null {
  return (
    firstImage(raw.apartmentImages) ??
    firstImage(raw.rideImages) ??
    readString(raw.coverPhoto) ??
    readString(raw.profilePicture)
  );
}
