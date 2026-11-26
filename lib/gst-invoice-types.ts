// GST invoice generator: data model and pure helpers (no React, no DOM).
// Shared by the client UI, the on-screen preview, and the jsPDF renderer.
// Separate from the plain invoice generator so the two can change on their own.

import { currencyMinorDigits, lineAmount, nextInvoiceNumber, roundTo, todayISO, uid, type Invoice } from "./invoice-types";
import { EXPORT_PLACE, placeOfSupplyLabel, stateFromGstin, stateTaxLabel, supplyKind } from "./gst";

export interface GstLineItem {
  id: string;
  description: string;
  /** HSN code for goods or SAC code for services. */
  hsn: string;
  rate: number;
  qty: number;
}

export interface GstSender {
  name: string;
  addressLines: string[];
  phone: string;
  email: string;
  gstin: string;
  /** Optional logo as a data URL. Stored once with the profile, never per invoice. */
  logoDataUrl?: string;
}

export interface GstClient {
  name: string;
  email: string;
  addressLines: string[];
  /** Empty when the client isn't GST registered. */
  gstin: string;
}

export interface GstInvoice {
  id: string;
  number: string;
  /** ISO date, "YYYY-MM-DD". */
  dateISO: string;
  dueText: string;
  /** ISO 4217 code. INR, except for exports billed in another currency. */
  currency: string;
  sender: GstSender;
  client: GstClient;
  items: GstLineItem[];
  /** GST rate in percent, e.g. 18. */
  gstRate: number;
  /** GST state code of the place of supply, e.g. "09"; "96" for an export. */
  placeOfSupply: string;
  /** Tax is payable by the recipient under reverse charge. */
  reverseCharge: boolean;
  /** Exports only: zero rated under a Letter of Undertaking instead of paying IGST. */
  exportUnderLut: boolean;
  /** Exports only: the LUT's ARN, printed with the export declaration. */
  lutArn: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

/** One tax row in the totals, e.g. CGST 9%. */
export interface TaxLine {
  label: string;
  rate: number;
  amount: number;
}

export interface GstTotals {
  taxableValue: number;
  tax: number;
  total: number;
  /** The rows that make up `tax`. */
  taxLines: TaxLine[];
  /** The client pays the tax to the government, so it's shown but left out of `total`. */
  reverseCharge: boolean;
}

type TaxInputs = Pick<GstInvoice, "items" | "gstRate" | "placeOfSupply" | "exportUnderLut" | "reverseCharge"> & {
  currency?: string;
  sender: Pick<GstSender, "gstin">;
};

/**
 * The GST rows: CGST + SGST (or UTGST) inside one state, IGST between states
 * and on exports, nothing on an export under LUT, and a plain "GST" row until
 * the supplier's GSTIN and the place of supply are known.
 */
export function gstTaxLines(
  taxableValue: number,
  rate: number,
  supplierGstin: string,
  placeOfSupply: string,
  exportUnderLut: boolean,
  digits = 2
): TaxLine[] {
  const at = (r: number) => roundTo(taxableValue * (r / 100), digits);
  switch (supplyKind(supplierGstin, placeOfSupply)) {
    case "intra": {
      const half = rate / 2;
      return [
        { label: "CGST", rate: half, amount: at(half) },
        { label: stateTaxLabel(placeOfSupply), rate: half, amount: at(half) },
      ];
    }
    case "inter":
      return [{ label: "IGST", rate, amount: at(rate) }];
    case "export":
      return exportUnderLut ? [{ label: "IGST", rate: 0, amount: 0 }] : [{ label: "IGST", rate, amount: at(rate) }];
    default:
      return [{ label: "GST", rate, amount: at(rate) }];
  }
}

export function computeGstTotals(invoice: TaxInputs): GstTotals {
  const digits = currencyMinorDigits(invoice.currency || "INR");
  // Round each line so the printed rows sum to the taxable value, and each tax
  // row so the rows sum to the tax.
  const taxableValue = roundTo(
    invoice.items.reduce((sum, item) => sum + roundTo(lineAmount(item), digits), 0),
    digits
  );
  const taxLines = gstTaxLines(
    taxableValue,
    Number(invoice.gstRate) || 0,
    invoice.sender.gstin,
    invoice.placeOfSupply,
    invoice.exportUnderLut,
    digits
  );
  const tax = roundTo(
    taxLines.reduce((sum, line) => sum + line.amount, 0),
    digits
  );
  return {
    taxableValue,
    tax,
    total: roundTo(invoice.reverseCharge ? taxableValue : taxableValue + tax, digits),
    taxLines,
    reverseCharge: invoice.reverseCharge,
  };
}

/** "CGST (9%)", "IGST (0%)". */
export function taxLineLabel(line: TaxLine): string {
  return `${line.label} (${line.rate}%)`;
}

/** The export line rule 46 asks for, or "" for a domestic invoice. */
export function exportDeclaration(invoice: Pick<GstInvoice, "placeOfSupply" | "exportUnderLut" | "lutArn">): string {
  if (invoice.placeOfSupply !== EXPORT_PLACE) return "";
  if (!invoice.exportUnderLut) return "Supply meant for export on payment of integrated tax.";
  const arn = invoice.lutArn.trim();
  return `Supply meant for export under Letter of Undertaking without payment of integrated tax.${arn ? ` LUT ARN: ${arn}` : ""}`;
}

/** The lines printed under the sender and the client: GSTINs, place of supply, reverse charge. */
export function gstDetailLines(
  invoice: Pick<GstInvoice, "sender" | "client" | "placeOfSupply" | "reverseCharge">
): { sender: string; client: string[] } {
  const senderGstin = invoice.sender.gstin.trim();
  const clientGstin = invoice.client.gstin.trim();
  const place = placeOfSupplyLabel(invoice.placeOfSupply);
  return {
    sender: senderGstin ? `GSTIN: ${senderGstin}` : "",
    client: [
      clientGstin ? `GSTIN: ${clientGstin}` : "",
      place ? `Place of supply: ${place}` : "",
      `Reverse charge: ${invoice.reverseCharge ? "Yes" : "No"}`,
    ].filter(Boolean),
  };
}

/** "₹1,18,000.00" for rupees (Indian grouping), "$1,800.00" for other currencies. */
export function formatMoney(amount: number, currency: string): string {
  const value = Number.isFinite(amount) ? amount : 0;
  const code = (currency || "INR").toUpperCase();
  try {
    return new Intl.NumberFormat(code === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency: code,
      currencyDisplay: "symbol",
    }).format(value);
  } catch {
    return `${value < 0 ? "-" : ""}${code} ${Math.abs(value).toFixed(2)}`.trim();
  }
}

/** "INR ₹1,18,000.00". */
export function formatMoneyWithCode(amount: number, currency: string): string {
  const code = (currency || "INR").toUpperCase();
  return `${code} ${formatMoney(amount, code)}`;
}

/** "26-27" for any date from 1 April 2026 to 31 March 2027. */
export function financialYear(iso: string): string {
  const [y, m] = (iso || "").split("-").map((p) => parseInt(p, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m)) return "";
  const start = m >= 4 ? y : y - 1;
  return `${String(start % 100).padStart(2, "0")}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/**
 * Next number after the highest saved one, keeping its prefix and padding.
 * With nothing saved yet it starts a series for the financial year of
 * `dateISO`: "INV/26-27/0001", within GST's 16 character limit.
 */
export function nextGstInvoiceNumber(invoices: Pick<GstInvoice, "number">[], dateISO = todayISO()): string {
  const fy = financialYear(dateISO);
  // nextInvoiceNumber only reads `number`.
  return nextInvoiceNumber(invoices as Invoice[], fy ? `INV/${fy}/` : "INV", 4);
}

export const DEFAULT_GST_SENDER: GstSender = {
  name: "",
  addressLines: [""],
  phone: "",
  email: "",
  gstin: "",
};

export function newGstLineItem(partial: Partial<GstLineItem> = {}): GstLineItem {
  return { id: uid(), description: "", hsn: "", rate: 0, qty: 1, ...partial };
}

function emptyClient(): GstClient {
  return { name: "", email: "", addressLines: [], gstin: "" };
}

export function emptyGstInvoice(sender: GstSender, number: string): GstInvoice {
  const now = Date.now();
  return {
    id: uid(),
    number,
    dateISO: todayISO(),
    dueText: "On Receipt",
    currency: "INR",
    sender: cloneGstSender(sender),
    client: emptyClient(),
    items: [newGstLineItem()],
    gstRate: 18,
    placeOfSupply: stateFromGstin(sender.gstin) ?? "",
    reverseCharge: false,
    exportUnderLut: false,
    lutArn: "",
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Stand-in until the working invoice is seeded from localStorage after mount.
 * Same shape as a fresh invoice so the page doesn't jump, with no random ids,
 * dates or date-based numbers, so server and client HTML match.
 */
export function placeholderGstInvoice(): GstInvoice {
  return {
    id: "placeholder",
    number: "INV0001",
    dateISO: "",
    dueText: "On Receipt",
    currency: "INR",
    sender: cloneGstSender(DEFAULT_GST_SENDER),
    client: emptyClient(),
    items: [{ id: "placeholder-item", description: "", hsn: "", rate: 0, qty: 1 }],
    gstRate: 18,
    placeOfSupply: "",
    reverseCharge: false,
    exportUnderLut: false,
    lutArn: "",
    notes: "",
    createdAt: 0,
    updatedAt: 0,
  };
}

/** Reference invoice for "Load example". Every detail is made up. */
export function exampleGstInvoice(number: string): GstInvoice {
  const now = Date.now();
  return {
    id: uid(),
    number,
    dateISO: todayISO(),
    dueText: "Within 30 days",
    currency: "INR",
    sender: {
      name: "Example Studio",
      addressLines: ["12 Hazratganj", "Lucknow, Uttar Pradesh 226001"],
      phone: "+91 98765 43210",
      email: "billing@example.in",
      gstin: "09ABCDE1234F1ZY",
    },
    client: {
      name: "Acme Software Pvt Ltd",
      email: "accounts@acme.example",
      addressLines: ["80 Feet Road, Koramangala", "Bengaluru, Karnataka 560034"],
      gstin: "29ABCDE1234F1ZW",
    },
    items: [
      newGstLineItem({ description: "Website design and development", hsn: "998314", rate: 60000, qty: 1 }),
      newGstLineItem({ description: "IT consulting (hours)", hsn: "998313", rate: 2500, qty: 6 }),
    ],
    gstRate: 18,
    placeOfSupply: "29",
    reverseCharge: false,
    exportUnderLut: false,
    lutArn: "",
    notes: "Payment by bank transfer. Bank details on request.",
    createdAt: now,
    updatedAt: now,
  };
}

export function cloneGstSender(sender: GstSender): GstSender {
  return {
    name: sender.name,
    addressLines: [...sender.addressLines],
    phone: sender.phone,
    email: sender.email,
    gstin: sender.gstin ?? "",
    logoDataUrl: sender.logoDataUrl,
  };
}

/** Deep-ish clone for saving snapshots and duplicating invoices. */
export function cloneGstInvoice(invoice: GstInvoice): GstInvoice {
  return {
    ...invoice,
    sender: cloneGstSender(invoice.sender),
    client: { ...invoice.client, addressLines: [...invoice.client.addressLines] },
    items: invoice.items.map((it) => ({ ...it })),
  };
}

/** "tax-invoice-INV-26-27-0001.pdf". */
export function gstInvoiceFileName(invoice: Pick<GstInvoice, "number">): string {
  const slug = (invoice.number || "invoice").trim().replace(/[^A-Za-z0-9._-]+/g, "-");
  return `tax-invoice-${slug || "invoice"}.pdf`;
}
