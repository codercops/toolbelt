"use client";

import {
  computeTotals,
  exportDeclaration,
  formatDate,
  formatMoney,
  formatMoneyWithCode,
  gstDetailLines,
  lineAmount,
  taxLineLabel,
  type Invoice,
  roundTo,
  currencyMinorDigits,
} from "@/lib/invoice-types";
import { amountInWordsINR } from "@/lib/gst";

interface InvoicePreviewProps {
  invoice: Invoice;
}

// The preview is always a light "paper" document, independent of the app theme,
// so it matches the downloaded PDF exactly.
export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const { subtotal, total, taxLines, reverseCharge } = computeTotals(invoice);
  const currency = invoice.currency || "USD";
  const gstOn = Boolean(invoice.gst?.enabled);
  const gstLines = gstDetailLines(invoice);
  const senderLines = [...invoice.sender.addressLines, invoice.sender.phone, invoice.sender.email, gstLines.sender]
    .map((l) => l?.trim())
    .filter(Boolean);
  const billLines = [invoice.billTo.email, ...invoice.billTo.addressLines, ...gstLines.billTo]
    .map((l) => l?.trim())
    .filter(Boolean);
  const declaration = exportDeclaration(invoice.gst);
  const words = gstOn && currency.toUpperCase() === "INR" ? amountInWordsINR(total) : "";

  return (
    <div className="rounded-lg overflow-hidden border border-[var(--hairline)] shadow-sm">
      <div className="bg-white text-[#1a1a1a] px-7 py-8 sm:px-9 sm:py-10 text-[13px] leading-normal">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            {invoice.sender.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={invoice.sender.logoDataUrl}
                alt=""
                className="h-11 w-auto max-w-[150px] object-contain mb-3"
              />
            ) : null}
            <h2 className="text-[24px] font-bold tracking-tight text-[#111827] break-words">
              {invoice.sender.name || "Your name"}
            </h2>
            <div className="mt-2 space-y-0.5 text-[#6b7280]">
              {senderLines.length ? (
                senderLines.map((l, i) => <div key={i} className="break-words">{l}</div>)
              ) : (
                <div className="text-[#9ca3af] italic">Your address & contact</div>
              )}
            </div>
          </div>

          <div className="text-right shrink-0 space-y-3">
            <MetaField label={gstOn ? "Tax Invoice" : "Invoice"} value={invoice.number || "—"} />
            <MetaField label="Date" value={formatDate(invoice.dateISO)} />
            <MetaField label="Due" value={invoice.dueText || "—"} />
            <MetaField label="Balance Due" value={formatMoneyWithCode(total, currency)} strong />
          </div>
        </div>

        <hr className="my-7 border-[#e5e7eb]" />

        {/* Bill to */}
        <div>
          <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#9ca3af]">
            Bill To
          </div>
          <div className="mt-2 text-[16px] font-bold text-[#111827] break-words">
            {invoice.billTo.name || "—"}
          </div>
          <div className="mt-1 space-y-0.5 text-[#6b7280]">
            {billLines.map((l, i) => (
              <div key={i} className="break-words">{l}</div>
            ))}
          </div>
        </div>

        {/* Line items */}
        <table className="w-full mt-9 border-collapse">
          <thead>
            <tr className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#111827] border-t-2 border-b-2 border-[#1f2937]">
              <th className="text-left py-2.5 pr-2">Description</th>
              {gstOn ? <th className="text-left py-2.5 px-2 whitespace-nowrap">HSN/SAC</th> : null}
              <th className="text-right py-2.5 px-2 whitespace-nowrap">Rate</th>
              <th className="text-right py-2.5 px-2">Qty</th>
              <th className="text-right py-2.5 pl-2 whitespace-nowrap">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr
                key={item.id}
                className={i < invoice.items.length - 1 ? "border-b border-dashed border-[#d1d5db]" : ""}
              >
                <td className="text-left py-3 pr-2 align-top text-[#111827] break-words">
                  {item.description || <span className="text-[#9ca3af]">—</span>}
                </td>
                {gstOn ? (
                  <td className="text-left py-3 px-2 align-top tabular-nums text-[#111827]">
                    {item.hsn || ""}
                  </td>
                ) : null}
                <td className="text-right py-3 px-2 align-top tabular-nums whitespace-nowrap text-[#111827]">
                  {formatMoney(item.rate, currency)}
                </td>
                <td className="text-right py-3 px-2 align-top tabular-nums text-[#111827]">
                  {item.qty}
                </td>
                <td className="text-right py-3 pl-2 align-top tabular-nums whitespace-nowrap text-[#111827]">
                  {formatMoney(roundTo(lineAmount(item), currencyMinorDigits(currency)), currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-[#e5e7eb]" />

        {/* Totals, with the GST amount in words and export line beside them */}
        <div className="flex justify-end gap-6 mt-5">
          {words || declaration ? (
            <div className="min-w-0 flex-1 space-y-2 text-[#4b5563]">
              {words ? (
                <div>
                  <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#9ca3af]">
                    Amount in words
                  </div>
                  <p className="mt-1 break-words">{words}</p>
                </div>
              ) : null}
              {declaration ? <p className="font-semibold text-[#111827] break-words">{declaration}</p> : null}
            </div>
          ) : null}
          <div className="w-full max-w-[280px]">
            <TotalRow label={gstOn ? "TAXABLE VALUE" : "SUBTOTAL"} value={formatMoney(subtotal, currency)} />
            {taxLines.map((line) => (
              <TotalRow
                key={line.label}
                label={taxLineLabel(line).toUpperCase()}
                value={formatMoney(line.amount, currency)}
              />
            ))}
            <div className="border-t border-[#e5e7eb] my-2" />
            <TotalRow label="TOTAL" value={formatMoney(total, currency)} strong />
            {reverseCharge ? (
              <div className="mt-1 text-[11px] text-[#6b7280] text-right">
                Tax payable by the recipient under reverse charge
              </div>
            ) : null}
          </div>
        </div>

        {/* Balance due (a GST invoice shows it in the header only) */}
        {gstOn ? null : (
          <div className="flex justify-end mt-6">
            <div className="text-right">
              <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#9ca3af]">
                Balance Due
              </div>
              <div className="mt-1 text-[22px] font-bold text-[#111827] tabular-nums">
                {formatMoneyWithCode(total, currency)}
              </div>
            </div>
          </div>
        )}

        {gstOn ? (
          <div className="mt-8 flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              {invoice.notes && invoice.notes.trim() ? (
                <>
                  <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#9ca3af]">
                    Notes
                  </div>
                  <p className="mt-1.5 text-[#4b5563] whitespace-pre-wrap break-words">{invoice.notes}</p>
                </>
              ) : null}
            </div>
            <div className="w-[200px] shrink-0 text-right">
              <div className="font-semibold text-[#111827] break-words">
                For {invoice.sender.name || "your business"}
              </div>
              <div className="mt-10 border-t border-[#9ca3af] pt-1.5 text-[11px] text-[#6b7280]">
                Authorised Signatory
              </div>
            </div>
          </div>
        ) : (
          invoice.notes && invoice.notes.trim() ? (
            <div className="mt-8 pt-5 border-t border-[#e5e7eb]">
              <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#9ca3af]">
                Notes
              </div>
              <p className="mt-1.5 text-[#4b5563] whitespace-pre-wrap break-words">{invoice.notes}</p>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

function MetaField({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#9ca3af]">
        {label}
      </div>
      <div
        className={
          "mt-0.5 tabular-nums text-[#111827] " + (strong ? "text-[14px] font-semibold" : "text-[14px]")
        }
      >
        {value}
      </div>
    </div>
  );
}

function TotalRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span
        className={
          "text-[11px] font-semibold tracking-[0.1em] uppercase " +
          (strong ? "text-[#111827]" : "text-[#6b7280]")
        }
      >
        {label}
      </span>
      <span
        className={
          "tabular-nums " + (strong ? "text-[15px] font-bold text-[#111827]" : "text-[13px] text-[#111827]")
        }
      >
        {value}
      </span>
    </div>
  );
}
