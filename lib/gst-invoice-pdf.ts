// Vector PDF renderer for GST tax invoices, drawn with jsPDF so the output is
// crisp and the text stays selectable. jsPDF is imported dynamically inside
// the handler so it never touches the server bundle. A4, as Indian invoices are.

import { formatDate, lineAmount, roundTo, currencyMinorDigits } from "./invoice-types";
import {
  computeGstTotals,
  exportDeclaration,
  formatMoney,
  formatMoneyWithCode,
  gstDetailLines,
  gstInvoiceFileName,
  taxLineLabel,
  type GstInvoice,
} from "./gst-invoice-types";
import { amountInWordsINR } from "./gst";

// A4 page, points.
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 50;
const LEFT = M;
const RIGHT = PAGE_W - M;
const CONTENT_W = RIGHT - LEFT;

// Table columns. Numbers are right-aligned at these edges; HSN/SAC is
// left-aligned at COL_HSN.
const COL_AMOUNT = RIGHT;
const COL_QTY = RIGHT - 96;
const COL_RATE = RIGHT - 166;
const COL_HSN = COL_RATE - 124;
const DESC_LEFT = LEFT;
const DESC_MAX_W = COL_HSN - 12 - DESC_LEFT;

// Totals block, and the column to its left for the amount in words.
const TOTALS_LABEL_LEFT = RIGHT - 210;
const SIDE_W = TOTALS_LABEL_LEFT - 24 - LEFT;

// Ink palette (RGB triples).
const INK: [number, number, number] = [26, 26, 26];
const BODY: [number, number, number] = [74, 74, 74];
const MUTE: [number, number, number] = [125, 128, 138];
const LINE: [number, number, number] = [224, 224, 224];
const STRONG: [number, number, number] = [30, 30, 30];

type Doc = import("jspdf").jsPDF;

function imageFormat(dataUrl: string): "PNG" | "JPEG" | "WEBP" {
  if (/^data:image\/jpe?g/i.test(dataUrl)) return "JPEG";
  if (/^data:image\/webp/i.test(dataUrl)) return "WEBP";
  return "PNG";
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(bin);
}

// Registers the subset Noto Sans (Latin + currency symbols incl. ₹). Falls back
// to the built-in Helvetica if the font can't be fetched (e.g. offline).
async function registerUnicodeFont(doc: Doc): Promise<string> {
  try {
    const [reg, bold] = await Promise.all([
      fetch("/fonts/NotoSans-Regular.ttf").then((r) => {
        if (!r.ok) throw new Error("font fetch failed");
        return r.arrayBuffer();
      }),
      fetch("/fonts/NotoSans-Bold.ttf").then((r) => {
        if (!r.ok) throw new Error("font fetch failed");
        return r.arrayBuffer();
      }),
    ]);
    doc.addFileToVFS("NotoSans-Regular.ttf", arrayBufferToBase64(reg));
    doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
    doc.addFileToVFS("NotoSans-Bold.ttf", arrayBufferToBase64(bold));
    doc.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");
    return "NotoSans";
  } catch {
    return "helvetica";
  }
}

export async function downloadGstInvoicePdf(invoice: GstInvoice): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const FONT = await registerUnicodeFont(doc);
  const { taxableValue, total, taxLines, reverseCharge } = computeGstTotals(invoice);
  const currency = invoice.currency || "INR";
  const digits = currencyMinorDigits(currency);
  const details = gstDetailLines(invoice);

  doc.setProperties({
    title: `Tax Invoice ${invoice.number}`,
    subject: `Tax invoice for ${invoice.client.name || "client"}`,
    author: invoice.sender.name || "CODERCOPS Tools",
    creator: "CODERCOPS Tools",
  });

  const TOP = 64;

  // ---- Header: sender block (left) ----
  let ly = TOP;
  const { sender } = invoice;
  if (sender.logoDataUrl) {
    try {
      const props = doc.getImageProperties(sender.logoDataUrl);
      const ratio = props.width && props.height ? props.width / props.height : 3;
      let h = 46;
      let w = h * ratio;
      if (w > 150) {
        w = 150;
        h = w / ratio;
      }
      doc.addImage(sender.logoDataUrl, imageFormat(sender.logoDataUrl), LEFT, TOP - 14, w, h);
      ly = TOP - 14 + h + 26;
    } catch {
      /* bad image data — skip the logo */
    }
  }

  doc.setFont(FONT, "bold");
  doc.setFontSize(20);
  doc.setTextColor(...INK);
  doc.text(sender.name || "Your business", LEFT, ly);
  ly += 20;

  doc.setFont(FONT, "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BODY);
  const senderLines = [...sender.addressLines, sender.phone, sender.email, details.sender].filter(
    (l) => l && l.trim()
  );
  for (const l of senderLines) {
    doc.text(l, LEFT, ly);
    ly += 15;
  }

  // ---- Header: invoice meta (right, label over value) ----
  let ry = TOP;
  const headerField = (label: string, value: string, valueSize = 11.5) => {
    doc.setFont(FONT, "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTE);
    doc.text(label.toUpperCase(), RIGHT, ry, { align: "right", charSpace: 0.6 });
    ry += 14;
    doc.setFont(FONT, "normal");
    doc.setFontSize(valueSize);
    doc.setTextColor(...INK);
    doc.text(value || "—", RIGHT, ry, { align: "right" });
    ry += 22;
  };
  headerField("Tax Invoice", invoice.number);
  headerField("Date", formatDate(invoice.dateISO));
  headerField("Due", invoice.dueText);
  headerField("Balance Due", formatMoneyWithCode(total, currency));

  // ---- Divider under header ----
  let y = Math.max(ly, ry) + 6;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(1);
  doc.line(LEFT, y, RIGHT, y);

  // ---- Bill to ----
  y += 30;
  doc.setFont(FONT, "bold");
  doc.setFontSize(8);
  doc.setTextColor(...MUTE);
  doc.text("BILL TO", LEFT, y, { charSpace: 0.6 });
  y += 20;
  doc.setFont(FONT, "bold");
  doc.setFontSize(14);
  doc.setTextColor(...INK);
  doc.text(invoice.client.name || "—", LEFT, y);
  y += 16;
  doc.setFont(FONT, "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...BODY);
  const clientLines = [invoice.client.email, ...invoice.client.addressLines, ...details.client].filter(
    (l) => l && l.trim()
  );
  for (const l of clientLines) {
    doc.text(l, LEFT, y);
    y += 14;
  }

  // ---- Line-item table ----
  y += 30;
  const drawTableHead = () => {
    doc.setDrawColor(...STRONG);
    doc.setLineWidth(0.9);
    doc.line(LEFT, y, RIGHT, y);
    y += 16;
    doc.setFont(FONT, "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text("DESCRIPTION", DESC_LEFT, y, { charSpace: 0.4 });
    doc.text("HSN/SAC", COL_HSN, y, { charSpace: 0.4 });
    doc.text("RATE", COL_RATE, y, { align: "right", charSpace: 0.4 });
    doc.text("QTY", COL_QTY, y, { align: "right", charSpace: 0.4 });
    doc.text("AMOUNT", COL_AMOUNT, y, { align: "right", charSpace: 0.4 });
    y += 10;
    doc.setDrawColor(...STRONG);
    doc.line(LEFT, y, RIGHT, y);
    y += 22;
  };
  drawTableHead();

  const items = invoice.items.length
    ? invoice.items
    : [{ id: "empty", description: "", hsn: "", rate: 0, qty: 0 }];
  items.forEach((item, i) => {
    if (y > PAGE_H - 170) {
      doc.addPage();
      y = 72;
      drawTableHead();
    }
    doc.setFont(FONT, "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    const descLines = doc.splitTextToSize(item.description || "—", DESC_MAX_W) as string[];
    doc.text(descLines, DESC_LEFT, y);
    if (item.hsn) doc.text(item.hsn, COL_HSN, y);
    doc.text(formatMoney(item.rate, currency), COL_RATE, y, { align: "right" });
    doc.text(String(item.qty), COL_QTY, y, { align: "right" });
    doc.text(formatMoney(roundTo(lineAmount(item), digits), currency), COL_AMOUNT, y, { align: "right" });

    const rowH = Math.max(descLines.length * 14, 16);
    y += rowH + 12;

    if (i < items.length - 1) {
      doc.setLineDashPattern([1.5, 2], 0);
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.7);
      doc.line(LEFT, y - 8, RIGHT, y - 8);
      doc.setLineDashPattern([], 0);
    }
  });

  // Keep the closing rule and the totals together above the footer.
  const TOTALS_BLOCK_H = 150 + 18 * (taxLines.length - 1) + (reverseCharge ? 14 : 0);
  if (y > PAGE_H - TOTALS_BLOCK_H) {
    doc.addPage();
    y = 72;
  }

  // Closing rule beneath the items.
  doc.setDrawColor(...LINE);
  doc.setLineWidth(1);
  doc.line(LEFT, y - 4, RIGHT, y - 4);

  // ---- Totals (right) ----
  let sy = y + 24;
  const totalsTop = sy;
  const totalRow = (label: string, value: string, opts: { size?: number; gap?: number } = {}) => {
    doc.setFont(FONT, "bold");
    doc.setFontSize(opts.size ?? 9.5);
    doc.setTextColor(...INK);
    doc.text(label, TOTALS_LABEL_LEFT, sy);
    doc.text(value, COL_AMOUNT, sy, { align: "right" });
    sy += opts.gap ?? 18;
  };
  totalRow("TAXABLE VALUE", formatMoney(taxableValue, currency));
  taxLines.forEach((line, i) => {
    totalRow(taxLineLabel(line).toUpperCase(), formatMoney(line.amount, currency), {
      gap: i === taxLines.length - 1 ? 20 : 18,
    });
  });
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.9);
  doc.line(TOTALS_LABEL_LEFT, sy - 10, RIGHT, sy - 10);
  totalRow("TOTAL", formatMoney(total, currency), { size: 10.5, gap: 16 });
  if (reverseCharge) {
    doc.setFont(FONT, "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTE);
    doc.text("Tax payable by the recipient under reverse charge", RIGHT, sy, { align: "right" });
    sy += 16;
  }

  // ---- Amount in words and the export declaration (left of the totals) ----
  // The balance due is in the header, so the space beside the totals holds
  // these instead of a second balance-due block. That keeps a short invoice on
  // one page.
  let leftY = totalsTop;
  const words = currency.toUpperCase() === "INR" ? amountInWordsINR(total) : "";
  if (words) {
    doc.setFont(FONT, "bold");
    doc.setFontSize(8);
    doc.setTextColor(...MUTE);
    doc.text("AMOUNT IN WORDS", LEFT, leftY, { charSpace: 0.6 });
    leftY += 15;
    doc.setFont(FONT, "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BODY);
    const wordLines = doc.splitTextToSize(words, SIDE_W) as string[];
    doc.text(wordLines, LEFT, leftY);
    leftY += wordLines.length * 12 + 10;
  }
  const declaration = exportDeclaration(invoice);
  if (declaration) {
    doc.setFont(FONT, "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
    const declLines = doc.splitTextToSize(declaration, SIDE_W) as string[];
    doc.text(declLines, LEFT, leftY);
    leftY += declLines.length * 12 + 10;
  }

  // ---- Notes (left) and signatory (right) ----
  let cy = Math.max(sy, leftY) + 18;
  const notes = (invoice.notes || "").trim();
  doc.setFont(FONT, "normal");
  doc.setFontSize(10);
  const noteLines = notes ? (doc.splitTextToSize(notes, CONTENT_W * 0.55) as string[]) : [];
  const rowH = Math.max(noteLines.length ? 15 + noteLines.length * 11.5 : 0, 58);
  if (cy + rowH > PAGE_H - 48) {
    doc.addPage();
    cy = 72;
  }
  if (noteLines.length) {
    doc.setFont(FONT, "bold");
    doc.setFontSize(8);
    doc.setTextColor(...MUTE);
    doc.text("NOTES", LEFT, cy, { charSpace: 0.6 });
    doc.setFont(FONT, "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BODY);
    doc.text(noteLines, LEFT, cy + 15);
  }
  doc.setFont(FONT, "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text(`For ${sender.name || "your business"}`, RIGHT, cy, { align: "right" });
  doc.setDrawColor(...MUTE);
  doc.setLineWidth(0.7);
  doc.line(RIGHT - 170, cy + 42, RIGHT, cy + 42);
  doc.setFont(FONT, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTE);
  doc.text("Authorised Signatory", RIGHT, cy + 55, { align: "right" });

  // ---- Footer ----
  drawFooter(doc, FONT);

  doc.save(gstInvoiceFileName(invoice));
}

function drawFooter(doc: Doc, FONT: string) {
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont(FONT, "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTE);
    doc.text("Generated with tools.codercops.com", PAGE_W / 2, PAGE_H - 36, { align: "center" });
  }
}
