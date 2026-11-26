import { describe, it, expect } from "vitest";
import {
  cloneInvoice,
  computeTotals,
  currencyMinorDigits,
  DEFAULT_SENDER,
  emptyInvoice,
  exportDeclaration,
  formatMoney,
  gstDetailLines,
  roundTo,
  nextInvoiceNumber,
  placeholderInvoice,
  type Invoice,
  type InvoiceGst,
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

  // A JavaScript number holds 15 digits exactly, so these used to come back lower than the number they follow.
  it.each([
    ["20261031143012345", "20261031143012346"],
    ["INV-9007199254740993", "INV-9007199254740994"],
    ["INV-9007199254740992", "INV-9007199254740993"],
    ["INV-99999999999999999999", "INV-100000000000000000000"],
    ["INV-9999999999999999999999", "INV-10000000000000000000000"],
    ["INV-0000000000000000000007", "INV-0000000000000000000008"],
    ["INV-12345678901234567890123456789", "INV-12345678901234567890123456790"],
    ["2026-00000000000000000099", "2026-00000000000000000100"],
  ])("counts on from %s without losing digits, giving %s", (highest, expected) => {
    expect(nextInvoiceNumber([base(highest)])).toBe(expected);
  });

  it("picks the highest of long numbers that a JavaScript number cannot tell apart", () => {
    expect(nextInvoiceNumber([base("INV-9007199254740993"), base("INV-9007199254740992")])).toBe("INV-9007199254740994");
    expect(nextInvoiceNumber([base("INV-9007199254740992"), base("INV-9007199254740993")])).toBe("INV-9007199254740994");
    expect(nextInvoiceNumber([base("INV-100000000000000000001"), base("INV-100000000000000000002"), base("INV-099999999999999999999")])).toBe(
      "INV-100000000000000000003",
    );
  });

  it("never gives a number that is not made of digits", () => {
    expect(nextInvoiceNumber([base(`INV-${"9".repeat(40)}`)])).toBe(`INV-1${"0".repeat(40)}`);
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

describe("GST invoices", () => {
  // Made-up GSTINs with correct check digits (not real registrations).
  const UP_GSTIN = "09ABCDE1234F1ZY";
  const CHANDIGARH_GSTIN = "04ABCDE1234F1Z8";

  function gst(partial: Partial<InvoiceGst> = {}): InvoiceGst {
    return { enabled: true, placeOfSupply: "09", reverseCharge: false, exportUnderLut: false, lutArn: "", ...partial };
  }

  function totals(placeOfSupply: string, extra: Partial<InvoiceGst> = {}, gstin = UP_GSTIN, amount = 100000) {
    return computeTotals({
      items: items([amount, 1]),
      taxRate: 18,
      currency: "INR",
      gst: gst({ placeOfSupply, ...extra }),
      sender: { gstin },
    });
  }

  it("splits into CGST and SGST inside one state", () => {
    const t = totals("09");
    expect(t.taxLines).toEqual([
      { label: "CGST", rate: 9, amount: 9000 },
      { label: "SGST", rate: 9, amount: 9000 },
    ]);
    expect(t.tax).toBe(18000);
    expect(t.total).toBe(118000);
  });

  it("charges IGST to another state", () => {
    const t = totals("29");
    expect(t.taxLines).toEqual([{ label: "IGST", rate: 18, amount: 18000 }]);
    expect(t.total).toBe(118000);
  });

  it("uses UTGST inside a union territory without a legislature", () => {
    const t = totals("04", {}, CHANDIGARH_GSTIN);
    expect(t.taxLines.map((l) => l.label)).toEqual(["CGST", "UTGST"]);
  });

  it("charges nothing on an export under LUT, and IGST on one without", () => {
    const lut = totals("96", { exportUnderLut: true });
    expect(lut.taxLines).toEqual([{ label: "IGST", rate: 0, amount: 0 }]);
    expect(lut.total).toBe(100000);
    const paid = totals("96");
    expect(paid.taxLines).toEqual([{ label: "IGST", rate: 18, amount: 18000 }]);
    expect(paid.total).toBe(118000);
  });

  it("shows one GST row until the supplier's GSTIN is known", () => {
    const t = totals("09", {}, "");
    expect(t.taxLines).toEqual([{ label: "GST", rate: 18, amount: 18000 }]);
  });

  it("leaves reverse-charge tax out of the total", () => {
    const t = totals("29", { reverseCharge: true });
    expect(t.tax).toBe(18000);
    expect(t.total).toBe(100000);
    expect(t.reverseCharge).toBe(true);
  });

  it("rounds each half of the split so the rows add up to the total", () => {
    const t = totals("09", {}, UP_GSTIN, 100.03);
    expect(t.taxLines.map((l) => l.amount)).toEqual([9, 9]);
    expect(t.tax).toBe(18);
    expect(t.total).toBe(118.03);
  });

  it("keeps the plain tax row when GST is off or missing", () => {
    const off = computeTotals({ items: items([100, 1]), taxRate: 18, gst: gst({ enabled: false }), sender: { gstin: UP_GSTIN } });
    expect(off.taxLines).toEqual([{ label: "Tax", rate: 18, amount: 18 }]);
    const old = computeTotals({ items: items([100, 1]), taxRate: 18 });
    expect(old.taxLines).toEqual([{ label: "Tax", rate: 18, amount: 18 }]);
    expect(old.reverseCharge).toBe(false);
  });

  it("starts GST invoices for a sender with a GSTIN", () => {
    const inv = emptyInvoice({ ...DEFAULT_SENDER, gstin: UP_GSTIN }, "CC/26-27/001");
    expect(inv.gst).toEqual(gst({ placeOfSupply: "09" }));
    expect(inv.currency).toBe("INR");
    expect(inv.taxRate).toBe(18);
    expect(inv.sender.gstin).toBe(UP_GSTIN);
  });

  it("keeps new invoices as before for a sender without a GSTIN", () => {
    const inv = emptyInvoice(DEFAULT_SENDER, "INV0001");
    expect(inv.gst?.enabled).toBe(false);
    expect(inv.currency).toBe("USD");
    expect(inv.taxRate).toBe(0);
  });

  it("copies GST settings when cloning, so edits don't leak into the saved copy", () => {
    const inv = emptyInvoice({ ...DEFAULT_SENDER, gstin: UP_GSTIN }, "CC/26-27/001");
    const copy = cloneInvoice(inv);
    copy.gst!.placeOfSupply = "29";
    expect(inv.gst!.placeOfSupply).toBe("09");
  });

  it("prints GSTINs, place of supply and reverse charge", () => {
    const inv = emptyInvoice({ ...DEFAULT_SENDER, gstin: UP_GSTIN }, "CC/26-27/001");
    inv.billTo.gstin = "29ABCDE1234F1ZW";
    inv.gst = gst({ placeOfSupply: "29" });
    expect(gstDetailLines(inv)).toEqual({
      sender: `GSTIN: ${UP_GSTIN}`,
      billTo: ["GSTIN: 29ABCDE1234F1ZW", "Place of supply: Karnataka (29)", "Reverse charge: No"],
    });
    inv.gst.enabled = false;
    expect(gstDetailLines(inv)).toEqual({ sender: "", billTo: [] });
  });

  it("writes the export declaration only on exports", () => {
    expect(exportDeclaration(gst({ placeOfSupply: "09" }))).toBe("");
    expect(exportDeclaration(gst({ placeOfSupply: "96" }))).toBe("Supply meant for export on payment of integrated tax.");
    expect(exportDeclaration(gst({ placeOfSupply: "96", exportUnderLut: true, lutArn: " AD0904260000000 " }))).toBe(
      "Supply meant for export under Letter of Undertaking without payment of integrated tax. LUT ARN: AD0904260000000"
    );
    expect(exportDeclaration(undefined)).toBe("");
  });

  it("formats rupees with Indian digit grouping", () => {
    expect(formatMoney(118000, "INR")).toBe("₹1,18,000.00");
    expect(formatMoney(1800, "USD")).toBe("$1,800.00");
  });
});
