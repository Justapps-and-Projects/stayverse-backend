/** Flutter `MoneyServiceV2.formatNaira`. */
export function formatNaira(amount?: number | null, decimalDigits = 2): string {
  const value = Number.isFinite(amount) ? Number(amount) : 0;
  const formatted = value.toLocaleString("en-NG", {
    minimumFractionDigits: decimalDigits,
    maximumFractionDigits: decimalDigits,
  });
  return `₦${formatted}`;
}
