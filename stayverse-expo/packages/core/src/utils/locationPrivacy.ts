/** Flutter `LocationPrivacy.extractArea` — hide exact street until after payment. */
export function extractArea(fullAddress?: string | null): string {
  const address = (fullAddress ?? "").trim();
  if (!address) return "Location not available";

  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "Location not available";
  if (parts.length === 1) return parts[0]!;
  return parts.length >= 3 ? parts[1]! : parts[0]!;
}
