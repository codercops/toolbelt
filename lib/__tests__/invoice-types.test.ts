import { describe, it, expect } from "vitest";
import {
  computeTotals,
  currencyMinorDigits,
  roundTo,
  nextInvoiceNumber,
  type Invoice,
  type LineItem,
} from "../invoice-types";

function items(...pairs: [number, number][]): LineItem[] {
  return pairs.map(([rate, qty], i) => ({ id: `i${i}`, description: "", rate, qty }));
}

describe("computeTotals rounding", () => {
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

  it("defaults to 2 digits for unknown currencies", () => {
    expect(currencyMinorDigits("USD")).toBe(2);
    expect(roundTo(1.005, 2)).toBe(1.01);
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
});
