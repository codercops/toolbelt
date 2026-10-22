import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Invoice } from "../invoice-types";
import { DEFAULT_SENDER, emptyInvoice } from "../invoice-types";

const { splitCalls } = vi.hoisted(() => ({
  // every splitTextToSize call, with the font active at the time (#246)
  splitCalls: [] as Array<{ text: string; fontSize: number; style: string }>,
}));

vi.mock("jspdf", () => ({
  jsPDF: class {
    fontSize = 16;
    style = "normal";

    setFont(_font: string, style: string) {
      this.style = style;
    }
    setFontSize(size: number) {
      this.fontSize = size;
    }
    setTextColor() {}
    setDrawColor() {}
    setFillColor() {}
    setLineWidth() {}
    setLineDashPattern() {}
    setProperties() {}
    setPage() {}
    addPage() {}
    addFileToVFS() {}
    addFont() {}
    addImage() {}
    getImageProperties() {
      return { width: 3, height: 1 };
    }
    getNumberOfPages() {
      return 1;
    }
    getY() {
      return 100;
    }
    text() {}
    rect() {}
    line() {}
    save() {}
    output() {
      return new Uint8Array();
    }
    splitTextToSize(text: string) {
      splitCalls.push({ text, fontSize: this.fontSize, style: this.style });
      return [text];
    }
  },
}));

import { downloadInvoicePdf } from "../invoice-pdf";

const DESCRIPTION =
  "Monthly retainer for backend development, code reviews and production support (June 2026)";

function invoiceWith(description: string): Invoice {
  const invoice = emptyInvoice(DEFAULT_SENDER, "INV-1");
  invoice.items = [
    { id: "r1", description, rate: 12500, qty: 1 },
    { id: "r2", description, rate: 12500, qty: 1 },
  ];
  return invoice;
}

describe("invoice PDF row font (#246)", () => {
  beforeEach(() => {
    splitCalls.length = 0;
  });

  it("measures every description at the 10.5pt row font, including the first row", async () => {
    await downloadInvoicePdf(invoiceWith(DESCRIPTION));

    const descriptions = splitCalls.filter((c) => c.text.length > 15);
    expect(descriptions.length).toBeGreaterThanOrEqual(2);
    for (const call of descriptions) {
      expect(call.fontSize).toBe(10.5);
      expect(call.style).toBe("normal");
    }
  });

  it("measures the empty-items placeholder description at the row font too", async () => {
    const invoice = emptyInvoice(DEFAULT_SENDER, "INV-1");
    invoice.items = [];
    await downloadInvoicePdf(invoice);

    for (const call of splitCalls) {
      if (call.text.length > 0) {
        expect(call.fontSize).toBe(10.5);
        expect(call.style).toBe("normal");
      }
    }
  });
});
