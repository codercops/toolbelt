import { describe, it, expect, vi, beforeEach } from "vitest";
import type { jsPDF as JsPdfType } from "jspdf";
import { downloadGstInvoicePdf } from "../gst-invoice-pdf";
import { exampleGstInvoice, type GstInvoice } from "../gst-invoice-types";

interface Measurement {
  text: string;
  lines: string[];
}

const measurements: Measurement[] = [];
const createdDocs: JsPdfType[] = [];
const savedNames: string[] = [];

vi.mock("jspdf", async () => {
  const actual = await vi.importActual<typeof import("jspdf")>("jspdf");

  class MockJsPDF extends actual.jsPDF {
    constructor(...args: ConstructorParameters<typeof actual.jsPDF>) {
      super(...args);
      this.save = ((name: string) => {
        savedNames.push(name);
        return this;
      }) as unknown as JsPdfType["save"];
      const originalSplit = this.splitTextToSize.bind(this);
      this.splitTextToSize = (
        text: string,
        maxW: number,
        options?: Parameters<JsPdfType["splitTextToSize"]>[2]
      ) => {
        const lines = originalSplit(text, maxW, options);
        measurements.push({ text, lines });
        return lines;
      };
      createdDocs.push(this);
    }
  }

  return { ...actual, jsPDF: MockJsPDF };
});

const DESCRIPTION =
  "Monthly retainer for backend development, code reviews and production support (June 2026)";

function invoice(patch: Partial<GstInvoice> = {}): GstInvoice {
  const base = exampleGstInvoice("INV/26-27/0001");
  return {
    ...base,
    items: [{ id: "1", description: DESCRIPTION, hsn: "998314", rate: 100000, qty: 1 }],
    ...patch,
  };
}

describe("GST invoice PDF", () => {
  beforeEach(() => {
    measurements.length = 0;
    createdDocs.length = 0;
    savedNames.length = 0;
  });

  it("lays out a tax invoice with the HSN/SAC column, the tax split, words and signatory", async () => {
    await downloadGstInvoicePdf(invoice());

    const doc = createdDocs[0];
    expect(doc.getNumberOfPages()).toBe(1);
    expect(savedNames).toEqual(["tax-invoice-INV-26-27-0001.pdf"]);

    // The HSN/SAC column starts at 255pt, so the description wraps before it.
    const row = measurements.find((m) => m.text === DESCRIPTION)!;
    expect(54 + doc.getTextWidth(row.lines[0])).toBeLessThan(255);

    const pdf = doc.output();
    for (const text of [
      "TAX INVOICE",
      "HSN/SAC",
      "998314",
      "GSTIN: 09ABCDE1234F1ZY",
      "GSTIN: 29ABCDE1234F1ZW",
      "Place of supply: Karnataka \\(29\\)",
      "Reverse charge: No",
      "TAXABLE VALUE",
      "IGST \\(18%\\)",
      "Rupees One Lakh Eighteen Thousand Only",
      "Authorised Signatory",
    ]) {
      expect(pdf).toContain(text);
    }
    expect(pdf).not.toContain("CGST");
  });

  it("splits into CGST and SGST for a client in the same state", async () => {
    await downloadGstInvoicePdf(invoice({ placeOfSupply: "09" }));
    const pdf = createdDocs[0].output();
    expect(pdf).toContain("CGST \\(9%\\)");
    expect(pdf).toContain("SGST \\(9%\\)");
    expect(pdf).not.toContain("IGST");
  });

  it("prints the LUT declaration on an export and leaves out the amount in words for foreign currency", async () => {
    await downloadGstInvoicePdf(
      invoice({ placeOfSupply: "96", exportUnderLut: true, lutArn: "AD0904260000000", currency: "USD" })
    );
    const pdf = createdDocs[0].output();
    expect(pdf).toContain("IGST \\(0%\\)");
    expect(pdf).toContain("Outside India \\(export\\)");
    expect(measurements.map((m) => m.text)).toContain(
      "Supply meant for export under Letter of Undertaking without payment of integrated tax. LUT ARN: AD0904260000000"
    );
    expect(pdf).not.toContain("Rupees");
  });
});
