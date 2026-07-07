"use client";

import { Plus, Trash2, GripVertical } from "lucide-react";
import { formatMoney, lineAmount, newLineItem, type LineItem } from "@/lib/invoice-types";
import { NumberInput } from "./NumberInput";

interface LineItemsEditorProps {
  items: LineItem[];
  currency: string;
  onChange: (items: LineItem[]) => void;
}

const cell =
  "px-2.5 py-2 rounded-md border border-[var(--hairline)] bg-[var(--bg-soft)] text-[var(--fg)] text-[13px] outline-none focus:border-[var(--hairline-strong)] transition-colors";

export function LineItemsEditor({ items, currency, onChange }: LineItemsEditorProps) {
  const update = (id: string, patch: Partial<LineItem>) =>
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const remove = (id: string) => onChange(items.filter((it) => it.id !== id));

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Column labels (hidden on mobile where rows stack) */}
      <div className="hidden sm:grid grid-cols-[16px_1fr_96px_64px_96px_28px] gap-2 px-1 font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--fg-dim)]">
        <span />
        <span>Description</span>
        <span className="text-right">Rate</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Amount</span>
        <span />
      </div>

      {items.map((item, i) => (
        <div
          key={item.id}
          className="grid grid-cols-[1fr_28px] sm:grid-cols-[16px_1fr_96px_64px_96px_28px] gap-2 items-center"
        >
          <div className="hidden sm:flex flex-col items-center text-[var(--fg-dim)]">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="hover:text-[var(--fg)] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
              aria-label="Move item up"
              title="Move up"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>
          </div>

          <input
            value={item.description}
            onChange={(e) => update(item.id, { description: e.target.value })}
            placeholder="Item description"
            className={cell + " col-span-1"}
          />

          <NumberInput
            value={item.rate}
            onChange={(n) => update(item.id, { rate: n })}
            className={cell + " text-right tabular-nums"}
            ariaLabel="Rate"
          />

          <NumberInput
            value={item.qty}
            onChange={(n) => update(item.id, { qty: n })}
            className={cell + " text-right tabular-nums"}
            ariaLabel="Quantity"
          />

          <div className="px-2.5 py-2 text-right text-[13px] tabular-nums text-[var(--fg-muted)] font-mono whitespace-nowrap overflow-hidden text-ellipsis">
            {formatMoney(lineAmount(item), currency)}
          </div>

          <button
            type="button"
            onClick={() => remove(item.id)}
            disabled={items.length === 1}
            className="flex items-center justify-center text-[var(--fg-dim)] hover:text-[var(--rose)] disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Remove item"
            title="Remove line item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...items, newLineItem()])}
        className="btn self-start mt-1"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add line item</span>
      </button>
    </div>
  );
}
