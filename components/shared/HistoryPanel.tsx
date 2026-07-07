"use client";

import { History, Pin, X, PinOff, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { cn } from "@/lib/cn";

export interface HistoryItem {
  id: string;
  value: string;
  pinned?: boolean;
  at: number;
  label?: string;
}

export function useHistory(key: string, max = 20) {
  const [items, setItems] = useLocalStorage<HistoryItem[]>(`cc:history:${key}`, []);

  function push(value: string, label?: string) {
    if (!value.trim()) return;
    setItems((prev) => {
      const existing = prev.find((p) => p.value === value);
      if (existing) {
        return prev.map((p) =>
          p.value === value ? { ...p, at: Date.now(), label: label ?? p.label } : p
        );
      }
      const next: HistoryItem = {
        id: Math.random().toString(36).slice(2, 10),
        value,
        at: Date.now(),
        label,
      };
      const filtered = [next, ...prev];
      // Keep pinned + `max` most recent non-pinned
      const pinned = filtered.filter((p) => p.pinned);
      const recent = filtered.filter((p) => !p.pinned).slice(0, max);
      return [...pinned, ...recent];
    });
  }

  function pin(id: string) {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : p)));
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  function clear() {
    setItems((prev) => prev.filter((p) => p.pinned));
  }

  return { items, push, pin, remove, clear };
}

interface HistoryPanelProps {
  storageKey: string;
  onSelect: (value: string) => void;
  title?: string;
  formatLabel?: (item: HistoryItem) => string;
}

export function HistoryPanel({ storageKey, onSelect, title = "History", formatLabel }: HistoryPanelProps) {
  const { items, pin, remove, clear } = useHistory(storageKey);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.at - a.at;
    });
  }, [items]);

  if (sorted.length === 0) return null;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
        <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)] flex items-center gap-1.5">
          <History className="w-3 h-3" />
          {title} · {sorted.length}
        </span>
        <button
          onClick={clear}
          className="btn btn-ghost py-1 !text-[11px]"
          aria-label="Clear unpinned history"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>
      <ul className="max-h-[220px] overflow-auto">
        {sorted.map((item) => (
          <li
            key={item.id}
            className={cn(
              "group flex items-center gap-2 px-3 py-1.5 border-b border-[var(--hairline)] last:border-b-0 hover:bg-white/[0.03]"
            )}
          >
            <button
              onClick={() => onSelect(item.value)}
              className="flex-1 min-w-0 text-left"
              title={item.value.slice(0, 240)}
            >
              <div className="font-mono text-[12px] text-[var(--fg)] truncate">
                {formatLabel ? formatLabel(item) : item.label ?? item.value.slice(0, 120)}
              </div>
              <div className="font-mono text-[10px] text-[var(--fg-dim)]">
                {item.pinned ? "pinned · " : ""}
                {formatRelative(item.at)}
              </div>
            </button>
            <button
              type="button"
              onClick={() => pin(item.id)}
              aria-label={item.pinned ? "Unpin" : "Pin"}
              className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded text-[var(--fg-dim)] opacity-70 hover:opacity-100 hover:text-[var(--fg)] group-hover:opacity-100 focus-visible:opacity-100 transition"
            >
              {item.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => remove(item.id)}
              aria-label="Remove"
              className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded text-[var(--fg-dim)] opacity-70 hover:opacity-100 hover:text-[var(--rose)] group-hover:opacity-100 focus-visible:opacity-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatRelative(at: number): string {
  const diff = Date.now() - at;
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
