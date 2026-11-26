// India GST helpers for the invoice generator: state codes, GSTIN checks,
// which tax applies (CGST + SGST, IGST or an export), and the amount in words.
// Pure functions with no imports, so invoice-types.ts can build on them.

export interface GstState {
  /** Two-digit GST state code, the first two characters of a GSTIN. */
  code: string;
  name: string;
  /**
   * A union territory without its own legislature. Supplies inside it carry
   * UTGST instead of SGST.
   */
  utgst?: boolean;
}

/** Place of supply code for exports ("Other Countries" in GST returns). */
export const EXPORT_PLACE = "96";

export const GST_STATES: GstState[] = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh", utgst: true },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu", utgst: true },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep", utgst: true },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands", utgst: true },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh", utgst: true },
  { code: "97", name: "Other Territory", utgst: true },
];

const STATE_BY_CODE = new Map(GST_STATES.map((s) => [s.code, s]));

/** "Uttar Pradesh (09)", "Outside India (export)", or "" for an unknown code. */
export function placeOfSupplyLabel(code: string): string {
  if (code === EXPORT_PLACE) return "Outside India (export)";
  const state = STATE_BY_CODE.get(code);
  return state ? `${state.name} (${state.code})` : "";
}

/** Uppercase with spaces removed, the way GSTINs are written. */
export function normalizeGstin(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, "").toUpperCase();
}

/** The state code a GSTIN was issued in, if it starts with a known one. */
export function stateFromGstin(gstin: string | undefined): string | undefined {
  const code = normalizeGstin(gstin).slice(0, 2);
  return STATE_BY_CODE.has(code) ? code : undefined;
}

const GSTIN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const GSTIN_FORMAT = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/**
 * True for a regular taxpayer's GSTIN: a known state code, the PAN, the entity
 * number, "Z", and a check digit that matches. Special registrations (UN
 * bodies, non-resident online services) use other formats and come back false,
 * so treat a false here as "check this", not as an error.
 */
export function isValidGstin(value: string | undefined): boolean {
  const gstin = normalizeGstin(value);
  if (!GSTIN_FORMAT.test(gstin) || !stateFromGstin(gstin)) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = GSTIN_CHARS.indexOf(gstin[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return GSTIN_CHARS[(36 - (sum % 36)) % 36] === gstin[14];
}

/**
 * GST invoice numbers are at most 16 characters of letters, digits, "-" and
 * "/", one series per financial year (rule 46 of the CGST Rules).
 */
export function isValidGstInvoiceNumber(number: string): boolean {
  return /^[A-Za-z0-9/-]{1,16}$/.test(number.trim());
}

export type SupplyKind = "intra" | "inter" | "export";

/**
 * Inside one state the tax splits into CGST + SGST (or UTGST); between states
 * it's IGST; to another country it's an export. Undefined until both the
 * supplier's state (from their GSTIN) and the place of supply are known.
 */
export function supplyKind(supplierGstin: string | undefined, placeOfSupply: string): SupplyKind | undefined {
  if (placeOfSupply === EXPORT_PLACE) return "export";
  const from = stateFromGstin(supplierGstin);
  if (!from || !STATE_BY_CODE.has(placeOfSupply)) return undefined;
  return from === placeOfSupply ? "intra" : "inter";
}

/** "SGST" for states, "UTGST" for union territories without a legislature. */
export function stateTaxLabel(placeOfSupply: string): "SGST" | "UTGST" {
  return STATE_BY_CODE.get(placeOfSupply)?.utgst ? "UTGST" : "SGST";
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowHundred(n: number): string {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : "");
}

function belowThousand(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return [hundreds ? `${ONES[hundreds]} Hundred` : "", rest ? belowHundred(rest) : ""]
    .filter(Boolean)
    .join(" ");
}

/** A whole number in words with Indian grouping: thousand, lakh, crore. */
function indianWords(n: number): string {
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 1e7);
  const lakh = Math.floor((n % 1e7) / 1e5);
  const thousand = Math.floor((n % 1e5) / 1000);
  const rest = n % 1000;
  return [
    crore ? `${indianWords(crore)} Crore` : "",
    lakh ? `${belowHundred(lakh)} Lakh` : "",
    thousand ? `${belowHundred(thousand)} Thousand` : "",
    rest ? belowThousand(rest) : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** "Rupees One Lakh Eighteen Thousand and Fifty Paise Only". */
export function amountInWordsINR(amount: number): string {
  if (!Number.isFinite(amount)) return "";
  // toPrecision(15) drops float noise before rounding to paise.
  const paiseTotal = Math.round(Number((Math.abs(amount) * 100).toPrecision(15)));
  const rupees = Math.floor(paiseTotal / 100);
  const paise = paiseTotal % 100;
  const words = `Rupees ${indianWords(rupees)}${paise ? ` and ${belowHundred(paise)} Paise` : ""} Only`;
  return amount < 0 && paiseTotal > 0 ? `Minus ${words}` : words;
}
