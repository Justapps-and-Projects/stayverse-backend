import { describe, expect, it } from "vitest";
import {
  normalizeNigerianPhone,
  validateAccountNumber,
  validateConfirmPassword,
  validateEmail,
  validateMoney,
  validateName,
  validateNin,
  validatePassword,
  validatePhoneNumber,
  validatePin,
} from "./validators";

describe("validateEmail (Flutter parity)", () => {
  it("requires email", () => {
    expect(validateEmail("")).toBe("email is required");
    expect(validateEmail(null)).toBe("email is required");
  });

  it("rejects invalid emails", () => {
    expect(validateEmail("not-an-email")).toBe("valid email is required");
  });

  it("accepts basic emails", () => {
    expect(validateEmail("you@stayverse.com")).toBeNull();
  });
});

describe("validatePassword (Flutter parity)", () => {
  it("requires password", () => {
    expect(validatePassword("")).toBe("Please enter your password");
  });

  it("enforces length and complexity messages", () => {
    expect(validatePassword("Ab1")).toBe("Password Must be greater than 6");
    expect(validatePassword("abcdef")).toBe(
      "Password must contain capital letter,number",
    );
  });

  it("accepts Flutter demo password", () => {
    expect(validatePassword("Pass1234!")).toBeNull();
  });
});

describe("validateName (Flutter parity)", () => {
  it("requires name", () => {
    expect(validateName("")).toBe("This field is required");
  });

  it("rejects invalid characters", () => {
    expect(validateName("Ada123")).toBe("Enter valid name");
  });

  it("accepts letters, spaces, commas, dots, hyphens", () => {
    expect(validateName("Ada")).toBeNull();
    expect(validateName("Mary-Jane")).toBeNull();
  });
});

describe("validatePhoneNumber (Flutter parity)", () => {
  it("requires phone", () => {
    expect(validatePhoneNumber("")).toBe("enter phone number");
  });

  it("accepts 10–11 digit local numbers", () => {
    expect(validatePhoneNumber("08012345678")).toBeNull();
    expect(validatePhoneNumber("8012345678")).toBeNull();
  });

  it("rejects invalid", () => {
    expect(validatePhoneNumber("123")).toBe("enter valid phone number");
  });
});

describe("validateConfirmPassword (Flutter parity)", () => {
  it("skips when password itself is invalid", () => {
    expect(validateConfirmPassword("x", "bad")).toBeNull();
  });

  it("requires matching passwords", () => {
    expect(validateConfirmPassword("Pass1234!", "Pass1234!")).toBeNull();
    expect(validateConfirmPassword("Pass1235!", "Pass1234!")).toBe(
      "Password does not match",
    );
  });
});

describe("normalizeNigerianPhone (Flutter parity)", () => {
  it("formats local numbers to +234", () => {
    expect(normalizeNigerianPhone("08012345678")).toBe("+2348012345678");
    expect(normalizeNigerianPhone("8012345678")).toBe("+2348012345678");
    expect(normalizeNigerianPhone("2348012345678")).toBe("+2348012345678");
  });
});

describe("validatePin (Flutter parity)", () => {
  it("requires pin", () => {
    expect(validatePin("")).toBe("Must not be empty");
  });

  it("requires exact length", () => {
    expect(validatePin("123")).toBe("Otp Code must be 6 digits");
    expect(validatePin("123456")).toBeNull();
  });
});

describe("validateNin (Flutter parity)", () => {
  it("requires nin", () => {
    expect(validateNin("")).toBe("NIN must not be empty");
  });

  it("requires 11 digits", () => {
    expect(validateNin("1234567890")).toBe("NIN must be 11 digits");
  });

  it("accepts 11-digit nin", () => {
    expect(validateNin("12345678901")).toBeNull();
  });
});

describe("validateMoney (Flutter parity)", () => {
  it("requires amount", () => {
    expect(validateMoney("")).toBe("Amount must not be empty");
    expect(validateMoney("abc")).toBe("Amount must not be empty");
  });

  it("rejects out-of-range amounts", () => {
    expect(validateMoney("50", { minAllowed: 100 })).toMatch(/at least/i);
    expect(validateMoney("2000000", { maxAllowed: 1_000_000 })).toMatch(
      /cannot exceed/i,
    );
  });

  it("accepts valid amounts", () => {
    expect(validateMoney("2500", { minAllowed: 100, maxAllowed: 1_000_000 })).toBeNull();
  });
});

describe("validateAccountNumber (Flutter parity)", () => {
  it("requires 10 digits", () => {
    expect(validateAccountNumber("")).toBe("Must not be empty");
    expect(validateAccountNumber("123")).toBe("Enter a valid account number");
    expect(validateAccountNumber("0123456789")).toBeNull();
  });
});
