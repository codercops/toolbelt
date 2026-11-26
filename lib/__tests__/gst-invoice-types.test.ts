import { describe, it, expect } from "vitest";
import {
  cloneGstInvoice,
  computeGstTotals,
  DEFAULT_GST_SENDER,
  emptyGstInvoice,
  exampleGstInvoice,
  exportDeclaration,
  financialYear,
  formatMoney,
  gstDetailLines,
  gstInvoiceFileName,
  nextGstInvoiceNumber,
  placeholderGstInvoice,
  type GstInvoice,
  type GstLineItem,
} from "../gst-invoice-types";
import { isValidGstInvoiceNumber } from "../gst";

// Made-up GSTINs with correct check digits (not real registrations).
const UP_GSTIN = "09ABCDE1234F1ZY";
const KA_GSTIN = "29ABCDE1234F1ZW";
const CHANDIGARH_GSTIN = "04ABCDE1234F1Z8";

function items(...pairs: [number, number][]): GstLineItem[] {
  return pairs.map(([rate, qty], i) => ({ id: `i${i}`, description: "", hsn: "998314", rate, qty }));
}

function totals(
  placeOfSupply: string,
  opts: { gstin?: string; amount?: number; exportUnderLut?: boolean; reverseCharge?: boolean; rate?: number } = {}
) {
  return computeGstTotals({
    items: items([opts.amount ?? 100000, 1]),
    gstRate: opts.rate ?? 18,
    currency: "INR",
    placeOfSupply,
    exportUnderLut: opts.exportUnderLut ?? false,
    reverseCharge: opts.reverseCharge ?? false,
    sender: { gstin: opts.gstin ?? UP_GSTIN },
  });
}

describe("computeGstTotals", () => {
  it("splits into CGST and SGST inside one state", () => {
    const t = totals("09");
    expect(t.taxLines).toEqual([
      { label: "CGST", rate: 9, amount: 9000 },
      { label: "SGST", rate: 9, amount: 9000 },
    ]);
    expect(t.taxableValue).toBe(100000);
    expect(t.tax).toBe(18000);
    expect(t.total).toBe(118000);
  });

  it("charges IGST to another state", () => {
    const t = totals("29");
    expect(t.taxLines).toEqual([{ label: "IGST", rate: 18, amount: 18000 }]);
    expect(t.total).toBe(118000);
  });

  it("uses UTGST inside a union territory without a legislature", () => {
    const t = totals("04", { gstin: CHANDIGARH_GSTIN });
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

  it("shows one GST row until the supplier's GSTIN or the place of supply is known", () => {
    expect(totals("09", { gstin: "" }).taxLines).toEqual([{ label: "GST", rate: 18, amount: 18000 }]);
    expect(totals("").taxLines).toEqual([{ label: "GST", rate: 18, amount: 18000 }]);
  });

  it("leaves reverse-charge tax out of the total", () => {
    const t = totals("29", { reverseCharge: true });
    expect(t.tax).toBe(18000);
    expect(t.total).toBe(100000);
    expect(t.reverseCharge).toBe(true);
  });

  it("rounds each half of the split so the rows add up to the total", () => {
    const t = totals("09", { amount: 100.03 });
    expect(t.taxLines.map((l) => l.amount)).toEqual([9, 9]);
    expect(t.tax).toBe(18);
    expect(t.total).toBe(118.03);
  });

  it("handles odd rates like 5%", () => {
    const t = totals("09", { rate: 5, amount: 1000 });
    expect(t.taxLines).toEqual([
      { label: "CGST", rate: 2.5, amount: 25 },
      { label: "SGST", rate: 2.5, amount: 25 },
    ]);
  });

  it("rounds each line so the rows sum to the taxable value", () => {
    const t = computeGstTotals({
      items: items([0.1, 1], [0.2, 1]),
      gstRate: 0,
      currency: "INR",
      placeOfSupply: "09",
      exportUnderLut: false,
      reverseCharge: false,
      sender: { gstin: UP_GSTIN },
    });
    expect(t.taxableValue).toBe(0.3);
    expect(t.total).toBe(0.3);
  });
});

describe("new invoices", () => {
  it("starts in rupees at 18%, with the supplier's state as the place of supply", () => {
    const inv = emptyGstInvoice({ ...DEFAULT_GST_SENDER, gstin: UP_GSTIN }, "INV/26-27/0001");
    expect(inv.currency).toBe("INR");
    expect(inv.gstRate).toBe(18);
    expect(inv.placeOfSupply).toBe("09");
    expect(inv.sender.gstin).toBe(UP_GSTIN);
    expect(inv.exportUnderLut).toBe(false);
    expect(inv.reverseCharge).toBe(false);
  });

  it("leaves the place of supply empty without a GSTIN", () => {
    expect(emptyGstInvoice(DEFAULT_GST_SENDER, "INV0001").placeOfSupply).toBe("");
  });

  it("has a placeholder with the same shape, the same on every call", () => {
    const strip = (inv: GstInvoice): GstInvoice => ({
      ...inv,
      id: "",
      number: "",
      dateISO: "",
      createdAt: 0,
      updatedAt: 0,
      items: inv.items.map((item) => ({ ...item, id: "" })),
    });
    expect(placeholderGstInvoice()).toEqual(placeholderGstInvoice());
    expect(strip(placeholderGstInvoice())).toEqual(strip(emptyGstInvoice(DEFAULT_GST_SENDER, "x")));
    expect(placeholderGstInvoice().sender).not.toBe(DEFAULT_GST_SENDER);
  });

  it("has a made-up example that splits as IGST and passes the number rule", () => {
    const inv = exampleGstInvoice("INV/26-27/0001");
    expect(inv.sender.gstin).toBe(UP_GSTIN);
    expect(inv.client.gstin).toBe(KA_GSTIN);
    expect(computeGstTotals(inv).taxLines.map((l) => l.label)).toEqual(["IGST"]);
    expect(isValidGstInvoiceNumber(inv.number)).toBe(true);
  });

  it("copies everything when cloning, so edits don't leak into the saved copy", () => {
    const inv = exampleGstInvoice("INV/26-27/0001");
    const copy = cloneGstInvoice(inv);
    copy.client.addressLines.push("extra");
    copy.items[0].hsn = "000000";
    copy.sender.gstin = "";
    expect(inv.client.addressLines).not.toContain("extra");
    expect(inv.items[0].hsn).toBe("998314");
    expect(inv.sender.gstin).toBe(UP_GSTIN);
  });
});

describe("numbering", () => {
  it.each([
    ["2026-04-01", "26-27"],
    ["2027-03-31", "26-27"],
    ["2026-11-26", "26-27"],
    ["2026-03-31", "25-26"],
    ["2099-12-01", "99-00"],
    ["", ""],
  ])("puts %s in financial year %s", (iso, fy) => {
    expect(financialYear(iso)).toBe(fy);
  });

  it("starts a series for the financial year, within 16 characters", () => {
    const first = nextGstInvoiceNumber([], "2026-11-26");
    expect(first).toBe("INV/26-27/0001");
    expect(isValidGstInvoiceNumber(first)).toBe(true);
  });

  it("counts on from the highest saved number, keeping its prefix", () => {
    expect(nextGstInvoiceNumber([{ number: "CC/26-27/007" }, { number: "CC/26-27/012" }], "2026-11-26")).toBe(
      "CC/26-27/013"
    );
  });

  it("names the PDF after the number", () => {
    expect(gstInvoiceFileName({ number: "INV/26-27/0001" })).toBe("tax-invoice-INV-26-27-0001.pdf");
  });
});

describe("printed details", () => {
  it("prints GSTINs, place of supply and reverse charge", () => {
    const inv = exampleGstInvoice("INV/26-27/0001");
    expect(gstDetailLines(inv)).toEqual({
      sender: `GSTIN: ${UP_GSTIN}`,
      client: [`GSTIN: ${KA_GSTIN}`, "Place of supply: Karnataka (29)", "Reverse charge: No"],
    });
  });

  it("leaves out an unregistered client's GSTIN and an unknown place of supply", () => {
    const inv = { ...exampleGstInvoice("x"), placeOfSupply: "", reverseCharge: true };
    inv.client.gstin = "";
    expect(gstDetailLines(inv).client).toEqual(["Reverse charge: Yes"]);
  });

  it("writes the export declaration only on exports", () => {
    expect(exportDeclaration({ placeOfSupply: "09", exportUnderLut: false, lutArn: "" })).toBe("");
    expect(exportDeclaration({ placeOfSupply: "96", exportUnderLut: false, lutArn: "" })).toBe(
      "Supply meant for export on payment of integrated tax."
    );
    expect(exportDeclaration({ placeOfSupply: "96", exportUnderLut: true, lutArn: " AD0904260000000 " })).toBe(
      "Supply meant for export under Letter of Undertaking without payment of integrated tax. LUT ARN: AD0904260000000"
    );
  });

  it("formats rupees with Indian digit grouping and other currencies as usual", () => {
    expect(formatMoney(118000, "INR")).toBe("₹1,18,000.00");
    expect(formatMoney(1800, "USD")).toBe("$1,800.00");
  });
});
