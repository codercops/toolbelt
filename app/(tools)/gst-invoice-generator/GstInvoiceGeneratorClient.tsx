"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Download, Eraser, FilePlus2, Save, Sparkles } from "lucide-react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useToast } from "@/components/shared/Toast";
import { useRegisterCommands } from "@/components/shared/CommandPalette";
import { uid } from "@/lib/invoice-types";
import {
  cloneGstInvoice,
  cloneGstSender,
  DEFAULT_GST_SENDER,
  emptyGstInvoice,
  exampleGstInvoice,
  nextGstInvoiceNumber,
  placeholderGstInvoice,
  type GstInvoice,
  type GstSender,
} from "@/lib/gst-invoice-types";
import { downloadGstInvoicePdf } from "@/lib/gst-invoice-pdf";
import { GstInvoiceForm } from "./components/GstInvoiceForm";
import { GstInvoicePreview } from "./components/GstInvoicePreview";
import { SavedGstInvoicesPanel } from "./components/SavedGstInvoicesPanel";

const INVOICES_KEY = "cc-gst-invoices";
const SENDER_KEY = "cc-gst-invoice-sender";
const PLACEHOLDER_INVOICE = placeholderGstInvoice();

export function GstInvoiceGeneratorClient() {
  const [invoices, setInvoices, , invoicesError] = useLocalStorage<GstInvoice[]>(INVOICES_KEY, []);
  const [sender, setSender, , senderError] = useLocalStorage<GstSender>(SENDER_KEY, DEFAULT_GST_SENDER);
  const [current, setCurrent] = useState<GstInvoice | null>(null);
  const { push } = useToast();
  const seededRef = useRef(false);

  // Warn instead of silently losing data if a write hits the storage quota.
  useEffect(() => {
    if (invoicesError || senderError) {
      push("Storage is full — your last change wasn't saved. Remove a saved invoice or a large logo.", "error");
    }
  }, [invoicesError, senderError, push]);

  // Seed the working invoice once, reading storage directly so we don't race the
  // async hydration inside useLocalStorage.
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    let savedInvoices: GstInvoice[] = [];
    let savedSender: GstSender = DEFAULT_GST_SENDER;
    try {
      const rawInv = window.localStorage.getItem(INVOICES_KEY);
      if (rawInv) savedInvoices = JSON.parse(rawInv);
      const rawSender = window.localStorage.getItem(SENDER_KEY);
      if (rawSender) savedSender = { ...DEFAULT_GST_SENDER, ...JSON.parse(rawSender) };
    } catch {
      /* ignore malformed storage */
    }
    setCurrent(emptyGstInvoice(savedSender, nextGstInvoiceNumber(savedInvoices)));
  }, []);

  const patch = (p: Partial<GstInvoice>) =>
    setCurrent((prev) => (prev ? { ...prev, ...p } : prev));

  const startNew = () => {
    setCurrent(emptyGstInvoice(sender, nextGstInvoiceNumber(invoices)));
    push("New invoice started");
  };

  const loadExample = () => {
    setCurrent(exampleGstInvoice(nextGstInvoiceNumber(invoices)));
    push("Example loaded");
  };

  const clearCurrent = () => {
    setCurrent((prev) => {
      const fresh = emptyGstInvoice(sender, prev?.number ?? nextGstInvoiceNumber(invoices));
      return prev ? { ...fresh, dateISO: prev.dateISO } : fresh;
    });
    push("Cleared", "info");
  };

  const save = () => {
    if (!current) return;
    const now = Date.now();
    const record = cloneGstInvoice({
      ...current,
      updatedAt: now,
      createdAt: current.createdAt || now,
    });
    // The logo is large; store it once under the sender profile and never in
    // each invoice, so a few saved invoices can't blow the localStorage quota.
    record.sender.logoDataUrl = undefined;
    setInvoices((prev) => {
      const exists = prev.some((i) => i.id === record.id);
      return exists ? prev.map((i) => (i.id === record.id ? record : i)) : [...prev, record];
    });
    setSender(cloneGstSender(current.sender)); // persist the reusable sender profile (with logo)
    setCurrent((prev) => (prev ? { ...prev, updatedAt: now, createdAt: record.createdAt } : prev));
    push(`Saved ${record.number} ✓`);
  };

  const duplicateFrom = (src: GstInvoice) => {
    const copy = cloneGstInvoice(src);
    copy.id = uid();
    copy.number = nextGstInvoiceNumber(invoices);
    copy.createdAt = copy.updatedAt = Date.now();
    copy.sender.logoDataUrl = sender.logoDataUrl; // show the profile logo while editing
    const persisted = cloneGstInvoice(copy);
    persisted.sender.logoDataUrl = undefined;
    setInvoices((prev) => [...prev, persisted]);
    setCurrent(copy);
    push(`Duplicated as ${copy.number} ✓`);
  };

  const editSaved = (id: string) => {
    const found = invoices.find((i) => i.id === id);
    if (!found) return;
    const rec = cloneGstInvoice(found);
    rec.sender.logoDataUrl = sender.logoDataUrl; // re-attach the profile logo for preview/PDF
    setCurrent(rec);
    push(`Editing ${found.number}`);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteSaved = (id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    setCurrent((prev) => {
      if (prev?.id !== id) return prev;
      const remaining = invoices.filter((i) => i.id !== id);
      return emptyGstInvoice(sender, nextGstInvoiceNumber(remaining));
    });
    push("Invoice deleted", "info");
  };

  const download = async () => {
    if (!current) return;
    try {
      await downloadGstInvoicePdf(current);
      push("PDF downloaded ✓");
    } catch {
      push("Could not generate the PDF", "error");
    }
  };

  useRegisterCommands(
    "gst-invoice-generator",
    [
      { id: "gst:new", section: "GST invoice", title: "New GST invoice", run: startNew },
      { id: "gst:example", section: "GST invoice", title: "Load example GST invoice", run: loadExample },
      { id: "gst:save", section: "GST invoice", title: "Save GST invoice", run: save },
      { id: "gst:download", section: "GST invoice", title: "Download GST invoice PDF", run: download },
      { id: "gst:clear", section: "GST invoice", title: "Clear current GST invoice", run: clearCurrent },
    ],
    [current, invoices, sender]
  );

  // Until the working invoice is seeded after mount, render the real layout
  // with a placeholder so the page doesn't jump (CLS), and make it inert.
  const ready = current !== null;
  const invoice = current ?? PLACEHOLDER_INVOICE;
  const isSaved = invoices.some((i) => i.id === invoice.id);

  return (
    <>
      {/* Toolbar */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-5" inert={!ready} aria-busy={!ready}>
        <div className="card flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn" onClick={startNew}>
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
            <button className="btn" onClick={loadExample}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load example</span>
            </button>
            <button className="btn" onClick={save}>
              <Save className="w-3.5 h-3.5" />
              <span>{isSaved ? "Update" : "Save"}</span>
            </button>
            <button className="btn" onClick={() => duplicateFrom(invoice)}>
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>
            <button className="btn btn-danger" onClick={clearCurrent}>
              <Eraser className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
          <button className="btn btn-primary" onClick={download}>
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </section>

      {/* Editor + live preview */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-6" inert={!ready} aria-busy={!ready}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          <GstInvoiceForm invoice={invoice} onChange={patch} />
          <div className="lg:sticky lg:top-20">
            <div className="mb-2 font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
              Live preview
            </div>
            <GstInvoicePreview invoice={invoice} />
          </div>
        </div>
      </section>

      {/* Saved invoices */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-8">
        <SavedGstInvoicesPanel
          invoices={invoices}
          currentId={current?.id ?? ""}
          onEdit={editSaved}
          onDuplicate={(id) => {
            const src = invoices.find((i) => i.id === id);
            if (src) duplicateFrom(src);
          }}
          onDelete={deleteSaved}
          onNew={startNew}
        />
      </section>
    </>
  );
}
