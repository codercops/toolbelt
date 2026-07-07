"use client";

import { useState } from "react";
import { Copy, FilePlus2, Pencil, Trash2, FileText, X } from "lucide-react";
import {
  computeTotals,
  formatDate,
  formatMoneyWithCode,
  type Invoice,
} from "@/lib/invoice-types";

interface SavedInvoicesPanelProps {
  invoices: Invoice[];
  currentId: string;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function SavedInvoicesPanel({
  invoices,
  currentId,
  onEdit,
  onDuplicate,
  onDelete,
  onNew,
}: SavedInvoicesPanelProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const sorted = [...invoices].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
        <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)] flex items-center gap-2">
          <FileText className="w-3 h-3" />
          Saved invoices
          <span className="text-[var(--fg-muted)]">({invoices.length})</span>
        </span>
        <button className="btn" onClick={onNew}>
          <FilePlus2 className="w-3.5 h-3.5" />
          <span>New invoice</span>
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="p-8 text-center">
          <FileText className="w-7 h-7 mx-auto text-[var(--fg-dim)] mb-2.5" />
          <p className="text-[13px] text-[var(--fg-muted)]">
            No saved invoices yet. Fill in the form and hit{" "}
            <span className="text-[var(--fg)]">Save</span> — everything stays in this browser.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--hairline)]">
          {sorted.map((inv) => {
            const { total } = computeTotals(inv);
            const active = inv.id === currentId;
            return (
              <li
                key={inv.id}
                className={
                  "flex flex-wrap items-center gap-3 px-4 py-3 transition-colors " +
                  (active ? "bg-white/[0.03]" : "hover:bg-white/[0.02]")
                }
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] text-[var(--fg)]">{inv.number}</span>
                    {active ? (
                      <span className="font-mono text-[9.5px] tracking-[0.16em] uppercase px-1.5 py-0.5 rounded text-[var(--cyan)] border border-[rgba(0,229,199,0.3)]">
                        Editing
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[12px] text-[var(--fg-muted)] truncate">
                    {inv.billTo.name || "No client"} · {formatDate(inv.dateISO)}
                  </div>
                </div>

                <span className="font-mono text-[13px] tabular-nums text-[var(--fg)] whitespace-nowrap">
                  {formatMoneyWithCode(total, inv.currency)}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    className="btn !px-2 !py-1.5"
                    onClick={() => onEdit(inv.id)}
                    title="Edit"
                    aria-label="Edit invoice"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="btn !px-2 !py-1.5"
                    onClick={() => onDuplicate(inv.id)}
                    title="Duplicate"
                    aria-label="Duplicate invoice"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {confirmId === inv.id ? (
                    <span className="inline-flex items-center gap-1">
                      <button
                        className="btn btn-danger !px-2 !py-1.5 !text-[11px]"
                        onClick={() => {
                          onDelete(inv.id);
                          setConfirmId(null);
                        }}
                        title="Confirm delete"
                        aria-label="Confirm delete"
                      >
                        Confirm?
                      </button>
                      <button
                        className="btn !px-2 !py-1.5"
                        onClick={() => setConfirmId(null)}
                        title="Cancel"
                        aria-label="Cancel delete"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ) : (
                    <button
                      className="btn btn-danger !px-2 !py-1.5"
                      onClick={() => setConfirmId(inv.id)}
                      title="Delete"
                      aria-label="Delete invoice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
