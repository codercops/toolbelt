import { describe, it, expect, vi, beforeEach } from "vitest";
import type { jsPDF as JsPdfType } from "jspdf";
import { downloadInvoicePdf } from "../invoice-pdf";
import type { Invoice } from "../invoice-types";

interface FontMeasurement {
  text: string;
  fontSize: number;
  fontStyle: string;
  lines: string[];
}

const measurements: FontMeasurement[] = [];
const createdDocs: JsPdfType[] = [];

vi.mock("jspdf", async () => {
  const actual = await vi.importActual<typeof import("jspdf")>("jspdf");

  class MockJsPDF extends actual.jsPDF {
    constructor(...args: ConstructorParameters<typeof actual.jsPDF>) {
      super(...args);
      this.save = (() => {
        return this;
      }) as unknown as JsPdfType["save"];
      const originalSplit = this.splitTextToSize.bind(this);
      this.splitTextToSize = (
        text: string,
        maxW: number,
        options?: Parameters<JsPdfType["splitTextToSize"]>[2]
      ) => {
        const fontSize = this.getFontSize();
        const font = this.getFont();
        const lines = originalSplit(text, maxW, options);
        measurements.push({
          text,
          fontSize,
          fontStyle: font.fontStyle,
          lines,
        });
        return lines;
      };
      createdDocs.push(this);
    }
  }

  return {
    ...actual,
    jsPDF: MockJsPDF,
  };
});

describe("invoice PDF line item text measurement", () => {
  beforeEach(() => {
    measurements.length = 0;
    createdDocs.length = 0;
  });

  it("measures descriptions at 10.5pt normal and prevents rate column overlap", async () => {
    const description =
      "Monthly retainer for backend development, code reviews and production support (June 2026)";

    const invoice: Invoice = {
      id: "inv-1",
      number: "INV-001",
      dateISO: "2026-10-22",
      dueText: "Due on Receipt",
      currency: "USD",
      sender: {
        name: "Acme Corp",
        addressLines: ["123 Main St"],
        phone: "555-0100",
        email: "billing@acme.com",
      },
      billTo: {
        name: "Client Inc",
        email: "client@example.com",
        addressLines: ["456 Market St"],
      },
      items: [
        { id: "1", description, rate: 12500, qty: 1 },
        { id: "2", description, rate: 12500, qty: 1 },
        { id: "3", description: "Item 3", rate: 100, qty: 1 },
        { id: "4", description: "Item 4", rate: 100, qty: 1 },
        { id: "5", description: "Item 5", rate: 100, qty: 1 },
        { id: "6", description: "Item 6", rate: 100, qty: 1 },
        { id: "7", description: "Item 7", rate: 100, qty: 1 },
        { id: "8", description: "First item on page 2", rate: 100, qty: 1 },
      ],
      taxRate: 0,
      notes: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await downloadInvoicePdf(invoice);

    expect(createdDocs.length).toBe(1);
    const doc = createdDocs[0];
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
    expect(measurements.length).toBe(8);

    // Verify every description is measured at 10.5pt normal, including the first row after a page break
    for (const m of measurements) {
      expect(m.fontSize).toBe(10.5);
      expect(m.fontStyle).toBe("normal");
    }

    // Verify row 1 wraps before "reviews", like row 2, preventing overlap with the rate column
    const [row1, row2] = measurements;
    expect(row1.lines[0]).toBe("Monthly retainer for backend development, code");
    expect(row2.lines[0]).toBe("Monthly retainer for backend development, code");
    expect(row1.lines[0]).not.toContain("reviews");
    expect(row1.lines[1]).toMatch(/^reviews/);

    // Verify no overlap with rate column:
    // Rate $12,500.00 right-aligned at COL_RATE (382), DESC starts at DESC_LEFT (54)
    const descRight = 54 + doc.getTextWidth(row1.lines[0]);
    const rateLeft = 382 - doc.getTextWidth("$12,500.00");
    expect(descRight).toBeLessThan(rateLeft);
  });
});
