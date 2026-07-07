// Vector PDF renderer for invoices, drawn programmatically with jsPDF so the
// output is crisp and the text stays selectable. jsPDF is imported dynamically
// inside the handler so it never touches the server bundle.

import {
  computeTotals,
  formatDate,
  formatMoney,
  formatMoneyWithCode,
  invoiceFileName,
  lineAmount,
  type Invoice,
} from "./invoice-types";

// Letter page, points. Points make font sizing and layout math intuitive.
const PAGE_W = 612;
const PAGE_H = 792;
const M = 54;
const LEFT = M;
const RIGHT = PAGE_W - M;
const CONTENT_W = RIGHT - LEFT;

// Table column right-edges (numeric columns are right-aligned).
const COL_AMOUNT = RIGHT;
const COL_QTY = RIGHT - 96;
const COL_RATE = RIGHT - 176;
const DESC_LEFT = LEFT;
const DESC_MAX_W = COL_RATE - 70 - DESC_LEFT;

// Totals block.
const TOTALS_LABEL_LEFT = RIGHT - 210;

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

// Registers a subset Noto Sans (Latin + currency symbols incl. ₹) so invoices
// with non-ASCII names or currency signs render correctly. Falls back to the
// built-in Helvetica if the font can't be fetched (e.g. offline).
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

export async function downloadInvoicePdf(invoice: Invoice): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const FONT = await registerUnicodeFont(doc);
  const { subtotal, tax, total } = computeTotals(invoice);
  const currency = invoice.currency || "USD";

  doc.setProperties({
    title: `Invoice ${invoice.number}`,
    subject: `Invoice for ${invoice.billTo.name || "client"}`,
    author: invoice.sender.name || "CODERCOPS Tools",
    creator: "CODERCOPS Tools",
  });

  const TOP = 66;

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
  doc.text(sender.name || "Your name", LEFT, ly);
  ly += 20;

  doc.setFont(FONT, "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BODY);
  const senderLines = [...sender.addressLines, sender.phone, sender.email].filter(
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
  headerField("Invoice", invoice.number);
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
  doc.text(invoice.billTo.name || "—", LEFT, y);
  y += 16;
  doc.setFont(FONT, "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...BODY);
  const billLines = [invoice.billTo.email, ...invoice.billTo.addressLines].filter(
    (l) => l && l.trim()
  );
  for (const l of billLines) {
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
    doc.text("RATE", COL_RATE, y, { align: "right", charSpace: 0.4 });
    doc.text("QTY", COL_QTY, y, { align: "right", charSpace: 0.4 });
    doc.text("AMOUNT", COL_AMOUNT, y, { align: "right", charSpace: 0.4 });
    y += 10;
    doc.setDrawColor(...STRONG);
    doc.line(LEFT, y, RIGHT, y);
    y += 22;
  };
  drawTableHead();

  const items = invoice.items.length ? invoice.items : [{ id: "empty", description: "", rate: 0, qty: 0 }];
  items.forEach((item, i) => {
    if (y > PAGE_H - 170) {
      doc.addPage();
      y = 72;
      drawTableHead();
    }
    const descLines = doc.splitTextToSize(item.description || "—", DESC_MAX_W) as string[];
    doc.setFont(FONT, "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    doc.text(descLines, DESC_LEFT, y);
    doc.text(formatMoney(item.rate, currency), COL_RATE, y, { align: "right" });
    doc.text(String(item.qty), COL_QTY, y, { align: "right" });
    doc.text(formatMoney(lineAmount(item), currency), COL_AMOUNT, y, { align: "right" });

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

  // Keep the closing rule, totals, and balance-due block together and above the
  // footer — otherwise the most important numbers can clip off the page bottom.
  const TOTALS_BLOCK_H = 210;
  if (y > PAGE_H - TOTALS_BLOCK_H) {
    doc.addPage();
    y = 72;
  }

  // Closing rule beneath the items.
  doc.setDrawColor(...LINE);
  doc.setLineWidth(1);
  doc.line(LEFT, y - 4, RIGHT, y - 4);

  // ---- Totals ----
  let sy = y + 24;
  const totalRow = (
    label: string,
    value: string,
    opts: { size?: number; bold?: boolean; mute?: boolean; gap?: number } = {}
  ) => {
    doc.setFont(FONT, opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size ?? 10);
    doc.setTextColor(...(opts.mute ? MUTE : INK));
    doc.text(label, TOTALS_LABEL_LEFT, sy);
    doc.setTextColor(...INK);
    doc.text(value, COL_AMOUNT, sy, { align: "right" });
    sy += opts.gap ?? 18;
  };
  totalRow("SUBTOTAL", formatMoney(subtotal, currency), { bold: true, size: 9.5 });
  totalRow(`TAX (${invoice.taxRate}%)`, formatMoney(tax, currency), { bold: true, size: 9.5, gap: 20 });
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.9);
  doc.line(TOTALS_LABEL_LEFT, sy - 10, RIGHT, sy - 10);
  totalRow("TOTAL", formatMoney(total, currency), { bold: true, size: 10.5, gap: 34 });

  // Prominent balance due (right-aligned, mirrors the header).
  doc.setFont(FONT, "bold");
  doc.setFontSize(8);
  doc.setTextColor(...MUTE);
  doc.text("BALANCE DUE", RIGHT, sy, { align: "right", charSpace: 0.6 });
  sy += 24;
  doc.setFont(FONT, "bold");
  doc.setFontSize(16);
  doc.setTextColor(...INK);
  doc.text(formatMoneyWithCode(total, currency), RIGHT, sy, { align: "right" });
  sy += 10;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(1);
  doc.line(TOTALS_LABEL_LEFT, sy, RIGHT, sy);

  // ---- Notes ----
  if (invoice.notes && invoice.notes.trim()) {
    let ny = sy + 34;
    if (ny > PAGE_H - 90) {
      doc.addPage();
      ny = 72;
    }
    doc.setFont(FONT, "bold");
    doc.setFontSize(8);
    doc.setTextColor(...MUTE);
    doc.text("NOTES", LEFT, ny, { charSpace: 0.6 });
    ny += 15;
    doc.setFont(FONT, "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BODY);
    const noteLines = doc.splitTextToSize(invoice.notes.trim(), CONTENT_W * 0.62) as string[];
    doc.text(noteLines, LEFT, ny);
  }

  // ---- Footer ----
  drawFooter(doc, FONT);

  doc.save(invoiceFileName(invoice));
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
