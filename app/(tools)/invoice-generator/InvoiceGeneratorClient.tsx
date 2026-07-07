"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Download, Eraser, FilePlus2, Save, Sparkles } from "lucide-react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useToast } from "@/components/shared/Toast";
import { useRegisterCommands } from "@/components/shared/CommandPalette";
import {
  cloneInvoice,
  cloneSender,
  DEFAULT_SENDER,
  emptyInvoice,
  exampleInvoice,
  nextInvoiceNumber,
  uid,
  type Invoice,
  type SenderProfile,
} from "@/lib/invoice-types";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import { InvoiceForm } from "./components/InvoiceForm";
import { InvoicePreview } from "./components/InvoicePreview";
import { SavedInvoicesPanel } from "./components/SavedInvoicesPanel";

const INVOICES_KEY = "cc-invoices";
const SENDER_KEY = "cc-invoice-sender";

export function InvoiceGeneratorClient() {
  const [invoices, setInvoices, , invoicesError] = useLocalStorage<Invoice[]>(INVOICES_KEY, []);
  const [sender, setSender, , senderError] = useLocalStorage<SenderProfile>(SENDER_KEY, DEFAULT_SENDER);
  const [current, setCurrent] = useState<Invoice | null>(null);
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
    let savedInvoices: Invoice[] = [];
    let savedSender: SenderProfile = DEFAULT_SENDER;
    try {
      const rawInv = window.localStorage.getItem(INVOICES_KEY);
      if (rawInv) savedInvoices = JSON.parse(rawInv);
      const rawSender = window.localStorage.getItem(SENDER_KEY);
      if (rawSender) savedSender = JSON.parse(rawSender);
    } catch {
      /* ignore malformed storage */
    }
    setCurrent(emptyInvoice(savedSender, nextInvoiceNumber(savedInvoices)));
  }, []);

  const patch = (p: Partial<Invoice>) =>
    setCurrent((prev) => (prev ? { ...prev, ...p } : prev));

  const startNew = () => {
    setCurrent(emptyInvoice(sender, nextInvoiceNumber(invoices)));
    push("New invoice started");
  };

  const loadExample = () => {
    setCurrent(exampleInvoice(nextInvoiceNumber(invoices)));
    push("Example loaded");
  };

  const clearCurrent = () => {
    setCurrent((prev) => {
      const fresh = emptyInvoice(sender, prev?.number ?? nextInvoiceNumber(invoices));
      return prev ? { ...fresh, dateISO: prev.dateISO, currency: prev.currency } : fresh;
    });
    push("Cleared", "info");
  };

  const save = () => {
    if (!current) return;
    const now = Date.now();
    const record = cloneInvoice({
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
    setSender(cloneSender(current.sender)); // persist the reusable sender profile (with logo)
    setCurrent((prev) => (prev ? { ...prev, updatedAt: now, createdAt: record.createdAt } : prev));
    push(`Saved ${record.number} ✓`);
  };

  const duplicateFrom = (src: Invoice) => {
    const copy = cloneInvoice(src);
    copy.id = uid();
    copy.number = nextInvoiceNumber(invoices);
    copy.createdAt = copy.updatedAt = Date.now();
    copy.sender.logoDataUrl = sender.logoDataUrl; // show the profile logo while editing
    const persisted = cloneInvoice(copy);
    persisted.sender.logoDataUrl = undefined;
    setInvoices((prev) => [...prev, persisted]);
    setCurrent(copy);
    push(`Duplicated as ${copy.number} ✓`);
  };

  const editSaved = (id: string) => {
    const found = invoices.find((i) => i.id === id);
    if (!found) return;
    const rec = cloneInvoice(found);
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
      return emptyInvoice(sender, nextInvoiceNumber(remaining));
    });
    push("Invoice deleted", "info");
  };

  const download = async () => {
    if (!current) return;
    try {
      await downloadInvoicePdf(current);
      push("PDF downloaded ✓");
    } catch {
      push("Could not generate the PDF", "error");
    }
  };

  useRegisterCommands(
    "invoice-generator",
    [
      { id: "inv:new", section: "Invoice", title: "New invoice", run: startNew },
      { id: "inv:example", section: "Invoice", title: "Load example invoice", run: loadExample },
      { id: "inv:save", section: "Invoice", title: "Save invoice", run: save },
      { id: "inv:download", section: "Invoice", title: "Download invoice PDF", run: download },
      { id: "inv:clear", section: "Invoice", title: "Clear current invoice", run: clearCurrent },
    ],
    [current, invoices, sender]
  );

  if (!current) {
    return (
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-8">
        <div className="card p-10 text-center text-[var(--fg-muted)] text-[13px]">Loading…</div>
      </section>
    );
  }

  const isSaved = invoices.some((i) => i.id === current.id);

  return (
    <>
      {/* Toolbar */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-5">
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
            <button className="btn" onClick={() => duplicateFrom(current)}>
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
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          <InvoiceForm invoice={current} onChange={patch} />
          <div className="lg:sticky lg:top-20">
            <div className="mb-2 font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
              Live preview
            </div>
            <InvoicePreview invoice={current} />
          </div>
        </div>
      </section>

      {/* Saved invoices */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-8">
        <SavedInvoicesPanel
          invoices={invoices}
          currentId={current.id}
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
