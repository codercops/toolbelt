"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { useToast } from "@/components/shared/Toast";
import type { GstClient, GstInvoice, GstLineItem, GstSender } from "@/lib/gst-invoice-types";
import {
  EXPORT_PLACE,
  GST_STATES,
  isValidGstin,
  isValidGstInvoiceNumber,
  normalizeGstin,
  stateFromGstin,
  stateTaxLabel,
  supplyKind,
} from "@/lib/gst";
import { GstLineItemsEditor } from "./GstLineItemsEditor";
import { NumberInput } from "./NumberInput";

interface GstInvoiceFormProps {
  invoice: GstInvoice;
  onChange: (patch: Partial<GstInvoice>) => void;
}

const LOGO_MAX_BYTES = 400 * 1024;
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AUD", "CAD", "SGD", "AED"];

const inputCls =
  "w-full px-3 py-2 rounded-md border border-[var(--hairline)] bg-[var(--bg-soft)] text-[var(--fg)] text-[13.5px] outline-none focus:border-[var(--hairline-strong)] transition-colors";
const labelCls =
  "block font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--fg-dim)] mb-1.5";
const hintCls = "mt-1 block text-[11.5px] text-[var(--fg-dim)]";
const warnCls = "mt-1 block text-[11.5px] text-[var(--amber)]";
const checkCls = "flex items-start gap-2 text-[12.5px] text-[var(--fg-muted)] cursor-pointer";
const GSTIN_WARNING = "Check this GSTIN: it should be 15 characters with a valid check digit.";

/** One line saying how the tax splits, so the choice of state is easy to check. */
function taxSplitText(invoice: GstInvoice): string {
  const rate = Number(invoice.gstRate) || 0;
  switch (supplyKind(invoice.sender.gstin, invoice.placeOfSupply)) {
    case "intra":
      return `Same state: CGST ${rate / 2}% + ${stateTaxLabel(invoice.placeOfSupply)} ${rate / 2}%.`;
    case "inter":
      return `Another state: IGST ${rate}%.`;
    case "export":
      return invoice.exportUnderLut ? "Export under LUT: no IGST." : `Export with IGST ${rate}%.`;
    default:
      return "Add your GSTIN and pick the place of supply to split the tax.";
  }
}

export function GstInvoiceForm({ invoice, onChange }: GstInvoiceFormProps) {
  const { push } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const patchSender = (patch: Partial<GstSender>) =>
    onChange({ sender: { ...invoice.sender, ...patch } });
  const patchClient = (patch: Partial<GstClient>) =>
    onChange({ client: { ...invoice.client, ...patch } });

  const setSenderGstin = (value: string) => {
    const gstin = normalizeGstin(value);
    const state = stateFromGstin(gstin);
    onChange({
      sender: { ...invoice.sender, gstin },
      // Fill in the place of supply from the GSTIN until one is picked.
      ...(state && !invoice.placeOfSupply ? { placeOfSupply: state } : {}),
    });
  };

  const onLogoFile = (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      push("Logo must be a PNG, JPEG, or WebP image", "error");
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      push("Logo is too large (max 400 KB)", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => patchSender({ logoDataUrl: String(reader.result) });
    reader.onerror = () => push("Could not read the image", "error");
    reader.readAsDataURL(file);
  };

  const senderGstin = invoice.sender.gstin ?? "";
  const clientGstin = invoice.client.gstin ?? "";
  const isExport = invoice.placeOfSupply === EXPORT_PLACE;

  return (
    <div className="flex flex-col gap-4">
      {/* From / supplier */}
      <Section title="From" hint="Saved as your reusable supplier profile">
        <div className="grid grid-cols-1 gap-3">
          <Field label="Business name">
            <input
              className={inputCls}
              value={invoice.sender.name}
              onChange={(e) => patchSender({ name: e.target.value })}
              placeholder="Example Studio"
            />
          </Field>
          <Field label="Address (one line each)">
            <textarea
              className={inputCls + " min-h-[64px] resize-y font-sans"}
              value={invoice.sender.addressLines.join("\n")}
              onChange={(e) => patchSender({ addressLines: e.target.value.split("\n") })}
              placeholder={"Street\nCity, State PIN"}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Phone">
              <input
                className={inputCls}
                value={invoice.sender.phone}
                onChange={(e) => patchSender({ phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </Field>
            <Field label="Email">
              <input
                className={inputCls}
                type="email"
                value={invoice.sender.email}
                onChange={(e) => patchSender({ email: e.target.value })}
                placeholder="billing@example.in"
              />
            </Field>
          </div>
          <Field label="Your GSTIN">
            <input
              className={inputCls + " uppercase font-mono"}
              value={senderGstin}
              maxLength={15}
              onChange={(e) => setSenderGstin(e.target.value)}
              placeholder="09ABCDE1234F1ZY"
              spellCheck={false}
            />
            {senderGstin && !isValidGstin(senderGstin) ? <span className={warnCls}>{GSTIN_WARNING}</span> : null}
          </Field>

          <Field label="Logo (optional)">
            <div className="flex items-center gap-3">
              {invoice.sender.logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={invoice.sender.logoDataUrl}
                  alt="Logo preview"
                  className="h-10 w-auto max-w-[120px] object-contain rounded border border-[var(--hairline)] bg-white p-1"
                />
              ) : null}
              <button type="button" className="btn" onClick={() => logoInputRef.current?.click()}>
                <ImagePlus className="w-3.5 h-3.5" />
                <span>{invoice.sender.logoDataUrl ? "Replace" : "Upload logo"}</span>
              </button>
              {invoice.sender.logoDataUrl ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => patchSender({ logoDataUrl: undefined })}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              ) : null}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  onLogoFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          </Field>
        </div>
      </Section>

      {/* Bill to */}
      <Section title="Bill to">
        <div className="grid grid-cols-1 gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Client name">
              <input
                className={inputCls}
                value={invoice.client.name}
                onChange={(e) => patchClient({ name: e.target.value })}
                placeholder="Acme Software Pvt Ltd"
              />
            </Field>
            <Field label="Client email">
              <input
                className={inputCls}
                type="email"
                value={invoice.client.email}
                onChange={(e) => patchClient({ email: e.target.value })}
                placeholder="accounts@acme.example"
              />
            </Field>
          </div>
          <Field label="Client address">
            <textarea
              className={inputCls + " min-h-[52px] resize-y font-sans"}
              value={invoice.client.addressLines.join("\n")}
              onChange={(e) => patchClient({ addressLines: e.target.value.split("\n") })}
              placeholder={"Street\nCity, State PIN"}
            />
          </Field>
          <Field label="Client GSTIN">
            <input
              className={inputCls + " uppercase font-mono"}
              value={clientGstin}
              maxLength={15}
              onChange={(e) => patchClient({ gstin: normalizeGstin(e.target.value) })}
              placeholder="Leave empty if not registered"
              spellCheck={false}
            />
            {clientGstin && !isValidGstin(clientGstin) ? <span className={warnCls}>{GSTIN_WARNING}</span> : null}
          </Field>
        </div>
      </Section>

      {/* Invoice meta */}
      <Section title="Invoice details">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Number">
            <input
              className={inputCls}
              value={invoice.number}
              onChange={(e) => onChange({ number: e.target.value })}
              placeholder="INV/26-27/0001"
            />
          </Field>
          <Field label="Date">
            <input
              className={inputCls}
              type="date"
              value={invoice.dateISO}
              onChange={(e) => onChange({ dateISO: e.target.value })}
            />
          </Field>
          <Field label="Due">
            <input
              className={inputCls}
              value={invoice.dueText}
              onChange={(e) => onChange({ dueText: e.target.value })}
              placeholder="On Receipt"
            />
          </Field>
          <Field label="Currency">
            <input
              className={inputCls + " uppercase"}
              list="gst-invoice-currencies"
              maxLength={3}
              value={invoice.currency}
              onChange={(e) => onChange({ currency: e.target.value.toUpperCase() })}
            />
            <datalist id="gst-invoice-currencies">
              {CURRENCIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
        </div>
        {!isValidGstInvoiceNumber(invoice.number) ? (
          <span className={warnCls}>
            GST invoice numbers can be at most 16 characters of letters, digits, - and /, for example INV/26-27/0001.
          </span>
        ) : null}
        {!isExport && invoice.currency.toUpperCase() !== "INR" ? (
          <span className={warnCls}>Invoices to clients in India are issued in rupees. Set the currency to INR.</span>
        ) : null}
      </Section>

      {/* Tax */}
      <Section title="GST">
        <div className="grid grid-cols-1 gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
            <Field label="Place of supply">
              <select
                className={inputCls}
                value={invoice.placeOfSupply}
                onChange={(e) => onChange({ placeOfSupply: e.target.value })}
              >
                <option value="">Select a state</option>
                {GST_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} · {s.name}
                  </option>
                ))}
                <option value={EXPORT_PLACE}>{EXPORT_PLACE} · Outside India (export)</option>
              </select>
            </Field>
            <Field label="GST rate (%)">
              <NumberInput
                className={inputCls + " text-right tabular-nums"}
                value={invoice.gstRate}
                onChange={(n) => onChange({ gstRate: n })}
                ariaLabel="GST rate percent"
              />
            </Field>
          </div>
          <span className={hintCls + " !mt-0"}>
            For services, usually the client&apos;s state. {taxSplitText(invoice)}
          </span>

          {isExport ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              <label className={checkCls + " sm:mt-6"}>
                <input
                  type="checkbox"
                  className="mt-0.5 accent-[var(--amber)]"
                  checked={invoice.exportUnderLut}
                  onChange={(e) => onChange({ exportUnderLut: e.target.checked })}
                />
                <span>Export under LUT, without IGST</span>
              </label>
              {invoice.exportUnderLut ? (
                <Field label="LUT ARN (optional)">
                  <input
                    className={inputCls + " font-mono"}
                    value={invoice.lutArn}
                    onChange={(e) => onChange({ lutArn: e.target.value })}
                    placeholder="AD0904260000000"
                    spellCheck={false}
                  />
                </Field>
              ) : null}
            </div>
          ) : null}

          <label className={checkCls}>
            <input
              type="checkbox"
              className="mt-0.5 accent-[var(--amber)]"
              checked={invoice.reverseCharge}
              onChange={(e) => onChange({ reverseCharge: e.target.checked })}
            />
            <span>
              Tax payable on reverse charge
              <span className={hintCls}>The client pays this tax to the government, so it is left out of the total.</span>
            </span>
          </label>
        </div>
      </Section>

      {/* Line items */}
      <Section title="Line items" hint="Use a negative rate for deductions">
        <GstLineItemsEditor
          items={invoice.items}
          currency={invoice.currency}
          onChange={(items: GstLineItem[]) => onChange({ items })}
        />
      </Section>

      {/* Notes */}
      <Section title="Notes (optional)">
        <textarea
          className={inputCls + " min-h-[64px] resize-y font-sans"}
          value={invoice.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Payment terms, bank details, your Udyam number…"
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-baseline justify-between mb-3.5">
        <h3 className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--fg-muted)]">
          {title}
        </h3>
        {hint ? (
          <span className="text-[11px] text-[var(--fg-dim)] hidden sm:inline">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}
