import { describe, it, expect } from "vitest";
import {
  computeTotals,
  currencyMinorDigits,
  DEFAULT_SENDER,
  emptyInvoice,
  formatMoney,
  roundTo,
  nextInvoiceNumber,
  placeholderInvoice,
  type Invoice,
  type LineItem,
} from "../invoice-types";

function items(...pairs: [number, number][]): LineItem[] {
  return pairs.map(([rate, qty], i) => ({ id: `i${i}`, description: "", rate, qty }));
}

describe("roundTo", () => {
  it.each([
    [-0.004, 2],
    [-0.4, 0],
    [-0.0004, 3],
    [-0, 2],
  ])("returns positive zero for %s rounded to %i digits", (value, digits) => {
    expect(roundTo(value, digits)).toBe(0);
  });

  it.each([NaN, Infinity, -Infinity])("returns zero for nonfinite input %s", (value) => {
    expect(roundTo(value, 2)).toBe(0);
  });

  it("rounds half away from zero for negative numbers", () => {
    expect(roundTo(-2.175, 2)).toBe(-2.18);
  });

  it("handles standard issue examples correctly", () => {
    expect(roundTo(1.45 * 1.5, 2)).toBe(2.18);
    expect(roundTo(16.45 * 1.5, 2)).toBe(24.68);
  });

  it("matches integer cent math across 60,000 rate/quantity combinations", () => {
    const qtys = [0.5, 1.5, 2.5];
    for (let rateCents = 1; rateCents <= 20000; rateCents++) {
      const rate = rateCents / 100;
      for (const qty of qtys) {
        const expectedCents = Math.round(rateCents * qty);
        const expected = expectedCents / 100;
        const actual = roundTo(rate * qty, 2);
        expect(actual).toBe(expected);
      }
    }
  });
});

describe("computeTotals rounding", () => {
  it("returns and formats positive zero when invoice lines cancel out", () => {
    const descriptions = ["Website build", "Deposit received", "Credit"];
    const t = computeTotals({
      items: items([1200, 1], [-1000.10, 1], [-199.90, 1]).map((item, i) => ({
        ...item,
        description: descriptions[i],
      })),
      taxRate: 0,
      currency: "USD",
    });
    expect.soft(t.subtotal).toBe(0);
    expect.soft(t.tax).toBe(0);
    expect.soft(t.total).toBe(0);
    expect.soft(formatMoney(t.subtotal, "USD")).toBe("$0.00");
  });

  it("preserves and formats a real negative amount", () => {
    const t = computeTotals({ items: items([-200, 1]), taxRate: 0, currency: "USD" });
    expect(t.subtotal).toBe(-200);
    expect(t.total).toBe(-200);
    expect(formatMoney(t.subtotal, "USD")).toBe("-$200.00");
  });

  it("rounds so subtotal, tax, and total agree to the cent", () => {
    const t = computeTotals({ items: items([0.1, 1], [0.2, 1]), taxRate: 0, currency: "USD" });
    expect(t.subtotal).toBe(0.3);
    expect(t.total).toBe(0.3);
  });

  it("computes tax with correct rounding", () => {
    const t = computeTotals({ items: items([100, 1]), taxRate: 8.25, currency: "USD" });
    expect(t.subtotal).toBe(100);
    expect(t.tax).toBe(8.25);
    expect(t.total).toBe(108.25);
  });

  it("uses zero minor-unit digits for JPY", () => {
    expect(currencyMinorDigits("JPY")).toBe(0);
    const t = computeTotals({ items: items([100.4, 1], [100.4, 1]), taxRate: 0, currency: "JPY" });
    expect(t.subtotal).toBe(200); // each 100.4 rounds to 100
  });

  it("uses three minor-unit digits for BHD", () => {
    expect(currencyMinorDigits("BHD")).toBe(3);
    const t = computeTotals({ items: items([1.2345, 1]), taxRate: 0, currency: "BHD" });
    expect(t.subtotal).toBe(1.235);
    expect(t.total).toBe(1.235);
  });

  it("defaults to 2 digits for unknown currencies", () => {
    expect(currencyMinorDigits("USD")).toBe(2);
    expect(roundTo(1.005, 2)).toBe(1.01);
  });

  it("handles 5% tax on 80.30 subtotal correctly", () => {
    const t = computeTotals({ items: items([80.30, 1]), taxRate: 5, currency: "USD" });
    expect(t.subtotal).toBe(80.30);
    expect(t.tax).toBe(4.02);
    expect(t.total).toBe(84.32);
  });
});

describe("nextInvoiceNumber", () => {
  const base = (number: string): Invoice =>
    ({ number } as Invoice);

  it("increments the highest number preserving prefix and padding", () => {
    expect(nextInvoiceNumber([base("INV0041"), base("INV0007")])).toBe("INV0042");
  });

  it("falls back to INV0001 for an empty list", () => {
    expect(nextInvoiceNumber([])).toBe("INV0001");
  });

  it.each([
    ["1001", "1002"],
    ["INV-07", "INV-08"],
    ["A1", "A2"],
    ["2026-001", "2026-002"],
    ["999", "1000"],
    ["INV0007", "INV0008"],
  ])("keeps the prefix and padding of %s, giving %s", (highest, expected) => {
    expect(nextInvoiceNumber([base(highest)])).toBe(expected);
  });

  it("lets a number that outgrows its width get longer", () => {
    expect(nextInvoiceNumber([base("INV-99")])).toBe("INV-100");
    expect(nextInvoiceNumber([base("INV9999")])).toBe("INV10000");
  });

  it("follows the highest number, not the last one saved", () => {
    expect(nextInvoiceNumber([base("INV-02"), base("INV-10"), base("INV-03")])).toBe("INV-11");
  });

  it("ignores trailing spaces and invoices without a number", () => {
    expect(nextInvoiceNumber([base("1001  "), base("draft"), base("")])).toBe("1002");
  });

  it("starts at the fallback prefix when no invoice has a number", () => {
    expect(nextInvoiceNumber([base("draft"), base("")])).toBe("INV0001");
    expect(nextInvoiceNumber([], "BILL", 6)).toBe("BILL000001");
  });
});

describe("placeholderInvoice", () => {
  // Blank out the fields that hold random ids or the current time, which the
  // placeholder leaves out so server and client renders match.
  function withoutVolatileFields(invoice: Invoice): Invoice {
    return {
      ...invoice,
      id: "",
      dateISO: "",
      createdAt: 0,
      updatedAt: 0,
      items: invoice.items.map((item) => ({ ...item, id: "" })),
    };
  }

  it("is the same on every call, so SSR and hydration render identical HTML", () => {
    expect(placeholderInvoice()).toEqual(placeholderInvoice());
  });

  it("has the same shape as a fresh invoice, so the editor keeps its size when it's replaced", () => {
    const fresh = emptyInvoice(DEFAULT_SENDER, nextInvoiceNumber([]));
    expect(withoutVolatileFields(placeholderInvoice())).toEqual(withoutVolatileFields(fresh));
  });

  it("doesn't share the default sender object", () => {
    expect(placeholderInvoice().sender).not.toBe(DEFAULT_SENDER);
  });
});
