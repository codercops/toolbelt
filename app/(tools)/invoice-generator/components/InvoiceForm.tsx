"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { useToast } from "@/components/shared/Toast";
import {
  defaultGst,
  type BillTo,
  type Invoice,
  type InvoiceGst,
  type LineItem,
  type SenderProfile,
} from "@/lib/invoice-types";
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
import { LineItemsEditor } from "./LineItemsEditor";
import { NumberInput } from "./NumberInput";

interface InvoiceFormProps {
  invoice: Invoice;
  onChange: (patch: Partial<Invoice>) => void;
}

const LOGO_MAX_BYTES = 400 * 1024;
const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AUD", "CAD", "JPY", "SGD", "AED", "BRL"];

const inputCls =
  "w-full px-3 py-2 rounded-md border border-[var(--hairline)] bg-[var(--bg-soft)] text-[var(--fg)] text-[13.5px] outline-none focus:border-[var(--hairline-strong)] transition-colors";
const labelCls =
  "block font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--fg-dim)] mb-1.5";
const hintCls = "mt-1 block text-[11.5px] text-[var(--fg-dim)]";
const warnCls = "mt-1 block text-[11.5px] text-[var(--amber)]";
const checkCls = "flex items-start gap-2 text-[12.5px] text-[var(--fg-muted)] cursor-pointer";

/** One line saying how the tax splits, so the choice of state is easy to check. */
function taxSplitText(invoice: Invoice, gst: InvoiceGst): string {
  const rate = Number(invoice.taxRate) || 0;
  switch (supplyKind(invoice.sender.gstin, gst.placeOfSupply)) {
    case "intra":
      return `Same state: CGST ${rate / 2}% + ${stateTaxLabel(gst.placeOfSupply)} ${rate / 2}%`;
    case "inter":
      return `Another state: IGST ${rate}%`;
    case "export":
      return gst.exportUnderLut ? "Export under LUT: no IGST" : `Export with IGST ${rate}%`;
    default:
      return "Add your GSTIN and the place of supply to split the tax.";
  }
}

export function InvoiceForm({ invoice, onChange }: InvoiceFormProps) {
  const { push } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const patchSender = (patch: Partial<SenderProfile>) =>
    onChange({ sender: { ...invoice.sender, ...patch } });
  const patchBillTo = (patch: Partial<BillTo>) =>
    onChange({ billTo: { ...invoice.billTo, ...patch } });

  // Invoices saved before GST mode have no settings; they start switched off.
  const gst: InvoiceGst = invoice.gst ?? { ...defaultGst(invoice.sender), enabled: false };
  const patchGst = (patch: Partial<InvoiceGst>) => onChange({ gst: { ...gst, ...patch } });
  const toggleGst = (on: boolean) => {
    if (!on) {
      patchGst({ enabled: false });
      return;
    }
    // Switching on: bill in rupees at 18% unless something else was chosen.
    onChange({
      gst: {
        ...gst,
        enabled: true,
        placeOfSupply: gst.placeOfSupply || stateFromGstin(invoice.sender.gstin) || "",
      },
      currency: invoice.currency === "USD" ? "INR" : invoice.currency,
      taxRate: invoice.taxRate || 18,
    });
  };
  const setSenderGstin = (value: string) => {
    const gstin = normalizeGstin(value);
    const state = stateFromGstin(gstin);
    onChange({
      sender: { ...invoice.sender, gstin },
      // Fill in the place of supply from the GSTIN until one is picked.
      ...(state && !gst.placeOfSupply ? { gst: { ...gst, placeOfSupply: state } } : {}),
    });
  };
  const senderGstin = invoice.sender.gstin ?? "";
  const clientGstin = invoice.billTo.gstin ?? "";
  const isExport = gst.placeOfSupply === EXPORT_PLACE;

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

  return (
    <div className="flex flex-col gap-4">
      {/* From / sender */}
      <Section title="From" hint="Saved as your reusable sender profile">
        <div className="grid grid-cols-1 gap-3">
          <Field label="Name / business">
            <input
              className={inputCls}
              value={invoice.sender.name}
              onChange={(e) => patchSender({ name: e.target.value })}
              placeholder="Jane Cooper"
            />
          </Field>
          <Field label="Address (one line each)">
            <textarea
              className={inputCls + " min-h-[64px] resize-y font-sans"}
              value={invoice.sender.addressLines.join("\n")}
              onChange={(e) => patchSender({ addressLines: e.target.value.split("\n") })}
              placeholder={"Street\nCity\nPostal code"}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Phone">
              <input
                className={inputCls}
                value={invoice.sender.phone}
                onChange={(e) => patchSender({ phone: e.target.value })}
                placeholder="+1 (555) 010-1234"
              />
            </Field>
            <Field label="Email">
              <input
                className={inputCls}
                type="email"
                value={invoice.sender.email}
                onChange={(e) => patchSender({ email: e.target.value })}
                placeholder="you@example.com"
              />
            </Field>
          </div>

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
              <button
                type="button"
                className="btn"
                onClick={() => logoInputRef.current?.click()}
              >
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
                value={invoice.billTo.name}
                onChange={(e) => patchBillTo({ name: e.target.value })}
                placeholder="Acme Inc."
              />
            </Field>
            <Field label="Client email">
              <input
                className={inputCls}
                type="email"
                value={invoice.billTo.email}
                onChange={(e) => patchBillTo({ email: e.target.value })}
                placeholder="accounts@acme.com"
              />
            </Field>
          </div>
          <Field label="Client address (optional)">
            <textarea
              className={inputCls + " min-h-[52px] resize-y font-sans"}
              value={invoice.billTo.addressLines.join("\n")}
              onChange={(e) => patchBillTo({ addressLines: e.target.value.split("\n") })}
              placeholder={"Street\nCity, Country"}
            />
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
              placeholder="INV0001"
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
              list="invoice-currencies"
              maxLength={3}
              value={invoice.currency}
              onChange={(e) => onChange({ currency: e.target.value.toUpperCase() })}
            />
            <datalist id="invoice-currencies">
              {CURRENCIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
        </div>
      </Section>

      {/* India GST */}
      <Section title="India GST" hint="For GST registered businesses">
        <label className={checkCls}>
          <input
            type="checkbox"
            className="mt-0.5 accent-[var(--lime)]"
            checked={gst.enabled}
            onChange={(e) => toggleGst(e.target.checked)}
          />
          <span>
            <span className="text-[var(--fg)]">Make this a GST tax invoice</span>
            <span className={hintCls}>
              Adds the GSTINs, HSN/SAC codes, place of supply and the CGST + SGST or IGST split.
            </span>
          </span>
        </label>

        {gst.enabled ? (
          <div className="mt-4 grid grid-cols-1 gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Your GSTIN">
                <input
                  className={inputCls + " uppercase font-mono"}
                  value={senderGstin}
                  maxLength={15}
                  onChange={(e) => setSenderGstin(e.target.value)}
                  placeholder="09ABCDE1234F1ZY"
                  spellCheck={false}
                />
                {senderGstin && !isValidGstin(senderGstin) ? (
                  <span className={warnCls}>Check this GSTIN: it should be 15 characters with a valid check digit.</span>
                ) : (
                  <span className={hintCls}>Saved with your sender profile.</span>
                )}
              </Field>
              <Field label="Client GSTIN">
                <input
                  className={inputCls + " uppercase font-mono"}
                  value={clientGstin}
                  maxLength={15}
                  onChange={(e) => patchBillTo({ gstin: normalizeGstin(e.target.value) })}
                  placeholder="Leave empty if not registered"
                  spellCheck={false}
                />
                {clientGstin && !isValidGstin(clientGstin) ? (
                  <span className={warnCls}>Check this GSTIN: it should be 15 characters with a valid check digit.</span>
                ) : null}
              </Field>
            </div>

            <Field label="Place of supply">
              <select
                className={inputCls}
                value={gst.placeOfSupply}
                onChange={(e) => patchGst({ placeOfSupply: e.target.value })}
              >
                <option value="">Select a state</option>
                {GST_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} · {s.name}
                  </option>
                ))}
                <option value={EXPORT_PLACE}>{EXPORT_PLACE} · Outside India (export)</option>
              </select>
              <span className={hintCls}>
                For services, usually the client&apos;s state. {taxSplitText(invoice, gst)}
              </span>
            </Field>

            {isExport ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                <label className={checkCls + " sm:mt-6"}>
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-[var(--lime)]"
                    checked={gst.exportUnderLut}
                    onChange={(e) => patchGst({ exportUnderLut: e.target.checked })}
                  />
                  <span>Export under LUT, without IGST</span>
                </label>
                {gst.exportUnderLut ? (
                  <Field label="LUT ARN (optional)">
                    <input
                      className={inputCls + " font-mono"}
                      value={gst.lutArn}
                      onChange={(e) => patchGst({ lutArn: e.target.value })}
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
                className="mt-0.5 accent-[var(--lime)]"
                checked={gst.reverseCharge}
                onChange={(e) => patchGst({ reverseCharge: e.target.checked })}
              />
              <span>
                Tax payable on reverse charge
                <span className={hintCls}>The client pays this tax to the government, so it is left out of the total.</span>
              </span>
            </label>

            {!isValidGstInvoiceNumber(invoice.number) ? (
              <span className={warnCls}>
                GST invoice numbers can be at most 16 characters of letters, digits, - and /, for example CC/26-27/001.
              </span>
            ) : null}
            {!isExport && invoice.currency !== "INR" ? (
              <span className={warnCls}>Invoices to clients in India are issued in rupees. Set the currency to INR.</span>
            ) : null}
          </div>
        ) : null}
      </Section>

      {/* Line items */}
      <Section title="Line items" hint="Use a negative rate for deductions">
        <LineItemsEditor
          items={invoice.items}
          currency={invoice.currency}
          showHsn={gst.enabled}
          onChange={(items: LineItem[]) => onChange({ items })}
        />
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label={gst.enabled ? "GST rate (%)" : "Tax rate (%)"}>
            <NumberInput
              className={inputCls + " text-right tabular-nums"}
              value={invoice.taxRate}
              onChange={(n) => onChange({ taxRate: n })}
              ariaLabel={gst.enabled ? "GST rate percent" : "Tax rate percent"}
            />
          </Field>
        </div>
      </Section>

      {/* Notes */}
      <Section title="Notes (optional)">
        <textarea
          className={inputCls + " min-h-[64px] resize-y font-sans"}
          value={invoice.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Payment terms, bank details, a thank-you note…"
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
