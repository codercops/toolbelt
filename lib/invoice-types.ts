// Invoice generator — data model and pure helpers (no React, no DOM).
// Shared by the client UI, the on-screen preview, and the jsPDF renderer.

export interface LineItem {
  id: string;
  description: string;
  rate: number;
  qty: number;
}

export interface SenderProfile {
  name: string;
  addressLines: string[];
  phone: string;
  email: string;
  /** Optional logo as a data URL (PNG/JPEG). Kept small; stored in localStorage. */
  logoDataUrl?: string;
}

export interface BillTo {
  name: string;
  email: string;
  addressLines: string[];
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
}

export interface InvoiceTotals {
  subtotal: number;
  tax: number;
  total: number;
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
  return Math.round((value + Number.EPSILON) * f) / f;
}

export function computeTotals(
  invoice: Pick<Invoice, "items" | "taxRate"> & { currency?: string }
): InvoiceTotals {
  const digits = currencyMinorDigits(invoice.currency || "USD");
  // Round each line to minor units so the printed rows actually sum to the
  // subtotal, then round subtotal, tax, and total so none disagree by a cent.
  const subtotal = roundTo(
    invoice.items.reduce((sum, item) => sum + roundTo(lineAmount(item), digits), 0),
    digits
  );
  const tax = roundTo(subtotal * ((Number(invoice.taxRate) || 0) / 100), digits);
  return { subtotal, tax, total: roundTo(subtotal + tax, digits) };
}

/** "$1,800.00" / "-$200.00" — currency symbol, no code. Falls back gracefully. */
export function formatMoney(amount: number, currency: string): string {
  const value = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "USD").toUpperCase(),
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
 * Next number after the highest existing one. Preserves the prefix and
 * zero-padding of the highest invoice (so "INV0041" -> "INV0042").
 * Empty list -> "INV0001".
 */
export function nextInvoiceNumber(invoices: Invoice[], fallbackPrefix = "INV", pad = 4): string {
  let max = 0;
  let prefix = fallbackPrefix;
  let width = pad;
  for (const inv of invoices) {
    const match = (inv.number || "").match(/^(.*?)(\d+)\s*$/);
    if (!match) continue;
    const n = parseInt(match[2], 10);
    if (n >= max) {
      max = n;
      prefix = match[1] || fallbackPrefix;
      width = Math.max(pad, match[2].length);
    }
  }
  return `${prefix}${String(max + 1).padStart(width, "0")}`;
}

export const DEFAULT_SENDER: SenderProfile = {
  name: "",
  addressLines: [""],
  phone: "",
  email: "",
};

export function newLineItem(partial: Partial<LineItem> = {}): LineItem {
  return { id: uid(), description: "", rate: 0, qty: 1, ...partial };
}

export function emptyInvoice(sender: SenderProfile, number: string): Invoice {
  const now = Date.now();
  return {
    id: uid(),
    number,
    dateISO: todayISO(),
    dueText: "On Receipt",
    currency: "USD",
    sender: cloneSender(sender),
    billTo: { name: "", email: "", addressLines: [] },
    items: [newLineItem()],
    taxRate: 0,
    notes: "",
    createdAt: now,
    updatedAt: now,
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
  };
}

/** Deep-ish clone for saving snapshots and duplicating invoices. */
export function cloneInvoice(invoice: Invoice): Invoice {
  return {
    ...invoice,
    sender: cloneSender(invoice.sender),
    billTo: { ...invoice.billTo, addressLines: [...invoice.billTo.addressLines] },
    items: invoice.items.map((it) => ({ ...it })),
  };
}

/** Safe filename fragment from an invoice number, e.g. "INV 0041" -> "INV-0041". */
export function invoiceFileName(invoice: Invoice): string {
  const slug = (invoice.number || "invoice").trim().replace(/[^A-Za-z0-9._-]+/g, "-");
  return `invoice-${slug || "invoice"}.pdf`;
}
