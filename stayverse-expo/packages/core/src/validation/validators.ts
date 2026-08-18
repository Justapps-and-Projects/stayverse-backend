/**
 * Flutter `Validator` parity — exact messages and patterns from
 * stayverse-user-app-master/lib/core/util/app/validator.dart
 */

const EMAIL_PATTERN = /^.+@[a-zA-Z]+\.[a-zA-Z]+(\.[a-zA-Z]+)*$/;
const PASSWORD_PATTERN = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{6,}$/;
const NAME_PATTERN = /^[a-zA-Z ,.\-]+$/;
const PHONE_PATTERN = /^(?:[+0]9)?[0-9]{10,11}$/;

function isEmpty(value: unknown): boolean {
  return value == null || String(value).trim().length === 0;
}

/** Flutter `Validator.validateEmail` */
export function validateEmail(value: string | null | undefined): string | null {
  if (isEmpty(value)) return "email is required";
  if (!EMAIL_PATTERN.test(String(value))) return "valid email is required";
  return null;
}

/** Flutter `Validator.validatePassword` */
export function validatePassword(value: string | null | undefined): string | null {
  if (isEmpty(value)) return "Please enter your password";
  const trimmed = String(value).trim();
  if (trimmed.length < 6) return "Password Must be greater than 6";
  if (!PASSWORD_PATTERN.test(trimmed)) {
    return "Password must contain capital letter,number";
  }
  return null;
}

/** Flutter `Validator.validateName` */
export function validateName(value: string | null | undefined): string | null {
  if (isEmpty(value)) return "This field is required";
  if (!NAME_PATTERN.test(String(value).trim())) return "Enter valid name";
  return null;
}

/** Flutter `Validator.validatePhoneNumber` */
export function validatePhoneNumber(value: string | null | undefined): string | null {
  if (isEmpty(value) || String(value).length === 0) return "enter phone number";
  if (!PHONE_PATTERN.test(String(value))) return "enter valid phone number";
  return null;
}

/** Flutter `Validator.validateConfirmPassword` */
export function validateConfirmPassword(
  confirmPassword: string | null | undefined,
  password: string | null | undefined,
): string | null {
  if (validatePassword(password) != null) return null;
  const confirmErr = validatePassword(confirmPassword);
  if (confirmErr != null) return confirmErr;
  if (String(confirmPassword).trim() !== String(password).trim()) {
    return "Password does not match";
  }
  return null;
}

/** Flutter `Validator.validatePin` */
export function validatePin(
  value: string | null | undefined,
  validLength = 6,
): string | null {
  if (isEmpty(value)) return "Must not be empty";
  if (String(value).length !== validLength) {
    return `Otp Code must be ${validLength} digits`;
  }
  return null;
}

/** Flutter `Validator.validateMoney` — amounts as plain numbers (no currency formatting required). */
export function validateMoney(
  value: string | null | undefined,
  options?: { minAllowed?: number; maxAllowed?: number },
): string | null {
  const minAllowed = options?.minAllowed ?? 0;
  const maxAllowed = options?.maxAllowed ?? Number.POSITIVE_INFINITY;
  if (isEmpty(value)) return "Amount must not be empty";
  const cleaned = String(value).replace(/[^\d.]/g, "");
  if (!cleaned) return "Amount must not be empty";
  const amount = Number(cleaned);
  if (!Number.isFinite(amount)) return "Amount must not be empty";
  if (amount < 0) return "Amount cannot be negative";
  if (amount < minAllowed) {
    return `Amount must be at least ₦${minAllowed.toLocaleString("en-NG")}`;
  }
  if (amount > maxAllowed) {
    return `Amount cannot exceed ₦${maxAllowed.toLocaleString("en-NG")}`;
  }
  return null;
}

/** Flutter `Validator.validateAccountNumber` */
export function validateAccountNumber(
  value: string | null | undefined,
): string | null {
  if (isEmpty(value)) return "Must not be empty";
  if (String(value).trim().length !== 10) return "Enter a valid account number";
  return null;
}

/** Flutter `Validator.validateNin` */
export function validateNin(value: string | null | undefined): string | null {
  if (isEmpty(value)) return "NIN must not be empty";
  if (String(value).trim().length < 11) return "NIN must be 11 digits";
  return null;
}

/** Flutter `Validator.normalizeNigerianPhone` — E.164 (+234…) for the API. */
export function normalizeNigerianPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("234")) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) {
    return `+234${digits.substring(1)}`;
  }
  if (digits.length === 10) return `+234${digits}`;
  return value.startsWith("+") ? value : `+${digits}`;
}

export const DevTestUserCredentials = {
  email: "user.demo@stayverse.local",
  password: "Pass1234!",
} as const;
