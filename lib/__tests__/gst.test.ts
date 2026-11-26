import { describe, it, expect } from "vitest";
import {
  amountInWordsINR,
  EXPORT_PLACE,
  isValidGstin,
  isValidGstInvoiceNumber,
  normalizeGstin,
  placeOfSupplyLabel,
  stateFromGstin,
  stateTaxLabel,
  supplyKind,
} from "../gst";

// Made-up GSTINs with correct check digits (not real registrations).
const UP_GSTIN = "09ABCDE1234F1ZY";
const KA_GSTIN = "29ABCDE1234F1ZW";

describe("isValidGstin", () => {
  it.each([UP_GSTIN, KA_GSTIN, "27AAAAA0000A1Z2", "07AAAAA0000A1Z4"])("accepts %s", (gstin) => {
    expect(isValidGstin(gstin)).toBe(true);
  });

  it("accepts lowercase and spaces, the way people paste them", () => {
    expect(isValidGstin(" 09abcde1234f1zy ")).toBe(true);
    expect(isValidGstin("09ABC DE1234 F1ZY")).toBe(true);
  });

  it("rejects a wrong check digit", () => {
    expect(isValidGstin("09ABCDE1234F1ZX")).toBe(false);
  });

  it.each([
    ["too short", "09ABCDE1234F1Z"],
    ["an unknown state code", "99ABCDE1234F1ZY"],
    ["a PAN in the wrong shape", "091BCDE1234F1ZY"],
    ["no Z in place 14", "09ABCDE1234F1AY"],
    ["empty", ""],
  ])("rejects %s", (_name, gstin) => {
    expect(isValidGstin(gstin)).toBe(false);
  });
});

describe("state codes", () => {
  it("reads the state from the first two characters", () => {
    expect(stateFromGstin(UP_GSTIN)).toBe("09");
    expect(stateFromGstin("  29abc")).toBe("29");
    expect(stateFromGstin("99ABCDE1234F1ZY")).toBeUndefined();
    expect(stateFromGstin(undefined)).toBeUndefined();
  });

  it("labels states, exports and unknown codes", () => {
    expect(placeOfSupplyLabel("09")).toBe("Uttar Pradesh (09)");
    expect(placeOfSupplyLabel(EXPORT_PLACE)).toBe("Outside India (export)");
    expect(placeOfSupplyLabel("")).toBe("");
    expect(placeOfSupplyLabel("25")).toBe("");
  });

  it("uses UTGST only in union territories without a legislature", () => {
    expect(stateTaxLabel("04")).toBe("UTGST"); // Chandigarh
    expect(stateTaxLabel("38")).toBe("UTGST"); // Ladakh
    expect(stateTaxLabel("07")).toBe("SGST"); // Delhi has a legislature
    expect(stateTaxLabel("09")).toBe("SGST");
  });

  it("normalizes GSTINs to uppercase without spaces", () => {
    expect(normalizeGstin(" 09abc de ")).toBe("09ABCDE");
    expect(normalizeGstin(undefined)).toBe("");
  });
});

describe("supplyKind", () => {
  it("is intra-state when the place of supply is the supplier's state", () => {
    expect(supplyKind(UP_GSTIN, "09")).toBe("intra");
  });

  it("is inter-state for another state", () => {
    expect(supplyKind(UP_GSTIN, "29")).toBe("inter");
  });

  it("is an export outside India, even without a GSTIN", () => {
    expect(supplyKind(UP_GSTIN, EXPORT_PLACE)).toBe("export");
    expect(supplyKind("", EXPORT_PLACE)).toBe("export");
  });

  it("is unknown until both sides are known", () => {
    expect(supplyKind("", "09")).toBeUndefined();
    expect(supplyKind(UP_GSTIN, "")).toBeUndefined();
  });
});

describe("isValidGstInvoiceNumber", () => {
  it.each(["CC/26-27/001", "INV0001", "2026-27/1234567"])("accepts %s", (n) => {
    expect(isValidGstInvoiceNumber(n)).toBe(true);
  });

  it.each([
    ["more than 16 characters", "CC/2026-2027/0001"],
    ["a space", "INV 001"],
    ["a hash", "INV#001"],
    ["nothing", ""],
  ])("rejects %s", (_name, n) => {
    expect(isValidGstInvoiceNumber(n)).toBe(false);
  });
});

describe("amountInWordsINR", () => {
  it.each([
    [0, "Rupees Zero Only"],
    [7, "Rupees Seven Only"],
    [19, "Rupees Nineteen Only"],
    [1001, "Rupees One Thousand One Only"],
    [118000, "Rupees One Lakh Eighteen Thousand Only"],
    [2500000, "Rupees Twenty Five Lakh Only"],
    [10000000, "Rupees One Crore Only"],
    [12345678.5, "Rupees One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight and Fifty Paise Only"],
    [1180.01, "Rupees One Thousand One Hundred Eighty and One Paise Only"],
    [1234567890, "Rupees One Hundred Twenty Three Crore Forty Five Lakh Sixty Seven Thousand Eight Hundred Ninety Only"],
  ])("writes %s as %s", (amount, words) => {
    expect(amountInWordsINR(amount)).toBe(words);
  });

  it("rounds to paise without float noise", () => {
    expect(amountInWordsINR(0.1 + 0.2)).toBe("Rupees Zero and Thirty Paise Only");
    expect(amountInWordsINR(99.999)).toBe("Rupees One Hundred Only");
  });

  it("marks negative amounts and ignores negative zero", () => {
    expect(amountInWordsINR(-500)).toBe("Minus Rupees Five Hundred Only");
    expect(amountInWordsINR(-0.001)).toBe("Rupees Zero Only");
  });

  it("returns nothing for a non-number", () => {
    expect(amountInWordsINR(NaN)).toBe("");
  });
});
