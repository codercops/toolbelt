// Invoice generator — data model and pure helpers (no React, no DOM).
// Shared by the client UI, the on-screen preview, and the jsPDF renderer.

import { EXPORT_PLACE, placeOfSupplyLabel, stateFromGstin, stateTaxLabel, supplyKind } from "./gst";

export interface LineItem {
  id: string;
  description: string;
  rate: number;
  qty: number;
  /** HSN code for goods or SAC code for services. Shown on GST invoices. */
  hsn?: string;
}

export interface SenderProfile {
  name: string;
  addressLines: string[];
  phone: string;
  email: string;
  /** Optional logo as a data URL (PNG/JPEG). Kept small; stored in localStorage. */
  logoDataUrl?: string;
  /** India GST registration number, printed on GST invoices. */
  gstin?: string;
}

export interface BillTo {
  name: string;
  email: string;
  addressLines: string[];
  /** The client's GSTIN, if they are GST registered. */
  gstin?: string;
}

/** India GST settings for one invoice. Off unless the sender turns it on. */
export interface InvoiceGst {
  enabled: boolean;
  /** GST state code of the place of supply, e.g. "09"; "96" for an export. */
  placeOfSupply: string;
  /** Tax is payable by the recipient under reverse charge. */
  reverseCharge: boolean;
  /** Exports only: zero rated under a Letter of Undertaking instead of paying IGST. */
  exportUnderLut: boolean;
  /** Exports only: the LUT's ARN, printed with the export declaration. */
  lutArn: string;
}

export interface Invoice {
  id: string;
  number: string;
  /** ISO date, "YYYY-MM-DD". */
  dateISO: string;
  /** Free text, e.g. "On Receipt" or a due date. */
  dueText: string;
  /** ISO 4217 code, e.g. "USD". */
  currency: string;
  sender: SenderProfile;
  billTo: BillTo;
  items: LineItem[];
  /** Percentage, e.g. 0 or 18. */
  taxRate: number;
  notes: string;
  createdAt: number;
  updatedAt: number;
  /** Missing on invoices saved before GST mode existed; treat that as off. */
  gst?: InvoiceGst;
}

/** One tax row in the totals, e.g. CGST 9%. */
export interface TaxLine {
  label: string;
  rate: number;
  amount: number;
}

export interface InvoiceTotals {
  subtotal: number;
  tax: number;
  total: number;
  /** The rows that make up `tax`: one "Tax" row, or the GST split. */
  taxLines: TaxLine[];
  /**
   * GST reverse charge: the client pays the tax to the government, so it's
   * shown but left out of `total`.
   */
  reverseCharge: boolean;
}

/** Collision-resistant id with a fallback for older browsers. */
export function uid(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function lineAmount(item: LineItem): number {
  const amount = (Number(item.rate) || 0) * (Number(item.qty) || 0);
  return Number.isFinite(amount) ? amount : 0;
}

/** Number of minor-unit digits for a currency (2 for USD, 0 for JPY, 3 for BHD). */
export function currencyMinorDigits(currency: string): number {
  try {
    const fmt = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "USD").toUpperCase(),
    });
    return fmt.resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

/** Round to a fixed number of decimals, nudging past float representation error. */
export function roundTo(value: number, digits: number): number {
  if (!Number.isFinite(value)) return 0;
  const f = Math.pow(10, digits);
  const sign = value < 0 ? -1 : 1;
  
  // Multiply first, then use toPrecision(15) to fix inherent JS float errors
  const scaled = Math.abs(value) * f;
  const preciseScaled = Number(scaled.toPrecision(15));
  
  // Round half away from zero and restore the original sign
  const result = (Math.round(preciseScaled) / f) * sign;
  return result === 0 ? 0 : result;
}

export function computeTotals(
  invoice: Pick<Invoice, "items" | "taxRate"> & {
    currency?: string;
    gst?: InvoiceGst;
    sender?: Pick<SenderProfile, "gstin">;
  }
): InvoiceTotals {
  const digits = currencyMinorDigits(invoice.currency || "USD");
  // Round each line to minor units so the printed rows actually sum to the
  // subtotal, then round subtotal, tax, and total so none disagree by a cent.
  const subtotal = roundTo(
    invoice.items.reduce((sum, item) => sum + roundTo(lineAmount(item), digits), 0),
    digits
  );
  const rate = Number(invoice.taxRate) || 0;
  const taxLines = invoice.gst?.enabled
    ? gstTaxLines(subtotal, rate, invoice.gst, invoice.sender?.gstin, digits)
    : [{ label: "Tax", rate, amount: roundTo(subtotal * (rate / 100), digits) }];
  const tax = roundTo(
    taxLines.reduce((sum, line) => sum + line.amount, 0),
    digits
  );
  const reverseCharge = Boolean(invoice.gst?.enabled && invoice.gst.reverseCharge);
  return {
    subtotal,
    tax,
    total: roundTo(reverseCharge ? subtotal : subtotal + tax, digits),
    taxLines,
    reverseCharge,
  };
}

/**
 * The GST rows for an invoice: CGST + SGST (or UTGST) inside one state, IGST
 * between states and on exports, nothing on an export under LUT, and a plain
 * "GST" row until the supplier's GSTIN and the place of supply are known.
 */
export function gstTaxLines(
  subtotal: number,
  rate: number,
  gst: InvoiceGst,
  supplierGstin: string | undefined,
  digits = 2
): TaxLine[] {
  const at = (r: number) => roundTo(subtotal * (r / 100), digits);
  switch (supplyKind(supplierGstin, gst.placeOfSupply)) {
    case "intra": {
      const half = rate / 2;
      return [
        { label: "CGST", rate: half, amount: at(half) },
        { label: stateTaxLabel(gst.placeOfSupply), rate: half, amount: at(half) },
      ];
    }
    case "inter":
      return [{ label: "IGST", rate, amount: at(rate) }];
    case "export":
      return gst.exportUnderLut
        ? [{ label: "IGST", rate: 0, amount: 0 }]
        : [{ label: "IGST", rate, amount: at(rate) }];
    default:
      return [{ label: "GST", rate, amount: at(rate) }];
  }
}

/** The legally required export line, or "" for a domestic invoice. */
export function exportDeclaration(gst: InvoiceGst | undefined): string {
  if (!gst?.enabled || gst.placeOfSupply !== EXPORT_PLACE) return "";
  if (!gst.exportUnderLut) return "Supply meant for export on payment of integrated tax.";
  const arn = gst.lutArn.trim();
  return `Supply meant for export under Letter of Undertaking without payment of integrated tax.${arn ? ` LUT ARN: ${arn}` : ""}`;
}

/**
 * The GST lines printed under the sender and the client on a GST invoice:
 * GSTINs, the place of supply, and whether reverse charge applies.
 */
export function gstDetailLines(
  invoice: Pick<Invoice, "gst" | "sender" | "billTo">
): { sender: string; billTo: string[] } {
  const gst = invoice.gst;
  if (!gst?.enabled) return { sender: "", billTo: [] };
  const senderGstin = (invoice.sender.gstin ?? "").trim();
  const clientGstin = (invoice.billTo.gstin ?? "").trim();
  const place = placeOfSupplyLabel(gst.placeOfSupply);
  return {
    sender: senderGstin ? `GSTIN: ${senderGstin}` : "",
    billTo: [
      clientGstin ? `GSTIN: ${clientGstin}` : "",
      place ? `Place of supply: ${place}` : "",
      `Reverse charge: ${gst.reverseCharge ? "Yes" : "No"}`,
    ].filter(Boolean),
  };
}

/** "CGST (9%)", "IGST (0%)", "Tax (18%)". */
export function taxLineLabel(line: TaxLine): string {
  return `${line.label} (${line.rate}%)`;
}

/** "$1,800.00" / "-$200.00" — currency symbol, no code. Falls back gracefully. */
export function formatMoney(amount: number, currency: string): string {
  const value = Number.isFinite(amount) ? amount : 0;
  const code = (currency || "USD").toUpperCase();
  try {
    // Rupee amounts use Indian grouping (₹1,18,000.00), as Indian invoices do.
    return new Intl.NumberFormat(code === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency: code,
      currencyDisplay: "symbol",
    }).format(value);
  } catch {
    return `${value < 0 ? "-" : ""}${(currency || "").toUpperCase()} ${Math.abs(value).toFixed(2)}`.trim();
  }
}

/** "USD $1,800.00" — currency code, a space, then the symbol amount. */
export function formatMoneyWithCode(amount: number, currency: string): string {
  const code = (currency || "USD").toUpperCase();
  return `${code} ${formatMoney(amount, code)}`;
}

/** "Jul 1, 2026" from "2026-07-01", parsed as a local date (no timezone drift). */
export function formatDate(iso: string): string {
  const parts = (iso || "").split("-").map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return iso || "";
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d);
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return iso;
  }
}

export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Next number after the highest existing one. Keeps the prefix (even an empty
 * one) and the zero-padding of the highest invoice exactly as they are:
 * "INV0041" -> "INV0042", "1001" -> "1002", "INV-07" -> "INV-08". A number that
 * outgrows its width just gets longer ("INV-99" -> "INV-100").
 * With no numbered invoice yet, starts at `fallbackPrefix` + `pad` digits:
 * "INV0001".
 */
export function nextInvoiceNumber(invoices: Invoice[], fallbackPrefix = "INV", pad = 4): string {
  // BigInt, because a number of more than 15 digits (a timestamp with milliseconds, say) is not exact as a JS number.
  let highest: { prefix: string; digits: string; value: bigint } | undefined;
  for (const inv of invoices) {
    const match = (inv.number || "").match(/^(.*?)(\d+)\s*$/);
    if (!match) continue;
    const value = BigInt(match[2]);
    if (!highest || value >= highest.value) {
      highest = { prefix: match[1], digits: match[2], value };
    }
  }
  if (!highest) return `${fallbackPrefix}${String(1).padStart(pad, "0")}`;
  return `${highest.prefix}${String(highest.value + BigInt(1)).padStart(highest.digits.length, "0")}`;
}

export const DEFAULT_SENDER: SenderProfile = {
  name: "",
  addressLines: [""],
  phone: "",
  email: "",
};

/**
 * GST settings for a new invoice. A sender who has saved a GSTIN gets GST
 * invoices by default, with their own state as the place of supply.
 */
export function defaultGst(sender: Pick<SenderProfile, "gstin">): InvoiceGst {
  return {
    enabled: Boolean(sender.gstin && sender.gstin.trim()),
    placeOfSupply: stateFromGstin(sender.gstin) ?? "",
    reverseCharge: false,
    exportUnderLut: false,
    lutArn: "",
  };
}

export function newLineItem(partial: Partial<LineItem> = {}): LineItem {
  return { id: uid(), description: "", rate: 0, qty: 1, ...partial };
}

export function emptyInvoice(sender: SenderProfile, number: string): Invoice {
  const now = Date.now();
  const gst = defaultGst(sender);
  return {
    id: uid(),
    number,
    dateISO: todayISO(),
    dueText: "On Receipt",
    currency: gst.enabled ? "INR" : "USD",
    sender: cloneSender(sender),
    billTo: { name: "", email: "", addressLines: [] },
    items: [newLineItem()],
    taxRate: gst.enabled ? 18 : 0,
    notes: "",
    createdAt: now,
    updatedAt: now,
    gst,
  };
}

/**
 * Stand-in for the working invoice until it's seeded from localStorage after
 * mount. It has the same shape as a fresh `emptyInvoice` (default sender, one
 * blank line item), so the editor and preview render at their real size during
 * SSR and hydration instead of collapsing and pushing the page down later.
 * It has no random ids or dates, so the server and client HTML match.
 */
export function placeholderInvoice(): Invoice {
  return {
    id: "placeholder",
    number: nextInvoiceNumber([]),
    dateISO: "",
    dueText: "On Receipt",
    currency: "USD",
    sender: cloneSender(DEFAULT_SENDER),
    billTo: { name: "", email: "", addressLines: [] },
    items: [{ id: "placeholder-item", description: "", rate: 0, qty: 1 }],
    taxRate: 0,
    notes: "",
    createdAt: 0,
    updatedAt: 0,
    gst: defaultGst(DEFAULT_SENDER),
  };
}

/** Reference invoice used by the "Load example" action. */
export function exampleInvoice(number: string): Invoice {
  const now = Date.now();
  return {
    id: uid(),
    number,
    dateISO: todayISO(),
    dueText: "On Receipt",
    currency: "USD",
    sender: {
      name: "Jane Cooper",
      addressLines: ["1200 Market Street", "San Francisco, CA 94103", "United States"],
      phone: "+1 (555) 010-1234",
      email: "jane@example.com",
    },
    billTo: { name: "Acme Inc.", email: "accounts@acme.com", addressLines: [] },
    items: [
      newLineItem({ description: "Full-stack development — June 2026", rate: 2000, qty: 1 }),
      newLineItem({ description: "Equipment advance (deduction)", rate: -200, qty: 1 }),
    ],
    taxRate: 0,
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function cloneSender(sender: SenderProfile): SenderProfile {
  return {
    name: sender.name,
    addressLines: [...sender.addressLines],
    phone: sender.phone,
    email: sender.email,
    logoDataUrl: sender.logoDataUrl,
    gstin: sender.gstin,
  };
}

/** Deep-ish clone for saving snapshots and duplicating invoices. */
export function cloneInvoice(invoice: Invoice): Invoice {
  return {
    ...invoice,
    sender: cloneSender(invoice.sender),
    billTo: { ...invoice.billTo, addressLines: [...invoice.billTo.addressLines] },
    items: invoice.items.map((it) => ({ ...it })),
    gst: invoice.gst ? { ...invoice.gst } : undefined,
  };
}

/** Safe filename fragment from an invoice number, e.g. "INV 0041" -> "INV-0041". */
export function invoiceFileName(invoice: Invoice): string {
  const slug = (invoice.number || "invoice").trim().replace(/[^A-Za-z0-9._-]+/g, "-");
  return `invoice-${slug || "invoice"}.pdf`;
}
