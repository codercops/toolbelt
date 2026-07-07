"use client";

import { ChevronUp, ChevronDown, X, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface FindBarProps {
  text: string;
  onClose: () => void;
  onScrollTo: (position: number) => void;
}

export function FindBar({ text, onClose, onScrollTo }: FindBarProps) {
  const [query, setQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [idx, setIdx] = useState(0);

  const matches = useMemo(() => {
    if (!query) return [] as number[];
    const positions: number[] = [];
    const haystack = caseSensitive ? text : text.toLowerCase();
    const needle = caseSensitive ? query : query.toLowerCase();
    let from = 0;
    while (from < haystack.length) {
      const pos = haystack.indexOf(needle, from);
      if (pos === -1) break;
      positions.push(pos);
      from = pos + Math.max(needle.length, 1);
    }
    return positions;
  }, [text, query, caseSensitive]);

  useEffect(() => setIdx(0), [query, caseSensitive]);

  useEffect(() => {
    if (matches[idx] !== undefined) onScrollTo(matches[idx]);
  }, [idx, matches, onScrollTo]);

  function next() {
    if (matches.length === 0) return;
    setIdx((i) => (i + 1) % matches.length);
  }
  function prev() {
    if (matches.length === 0) return;
    setIdx((i) => (i - 1 + matches.length) % matches.length);
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) prev();
      else next();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  return (
    <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-1.5 rounded-md border border-[var(--hairline-strong)] bg-[var(--bg-raise)] shadow-lg animate-slide-down">
      <Search className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKey}
        placeholder="Find in input..."
        className="w-40 sm:w-56 bg-transparent text-[12.5px] text-[var(--fg)] outline-none font-mono"
      />
      <span className="font-mono text-[11px] text-[var(--fg-dim)] min-w-[50px] text-right">
        {matches.length === 0 ? "0" : `${idx + 1}/${matches.length}`}
      </span>
      <button
        onClick={() => setCaseSensitive((v) => !v)}
        className="px-1.5 text-[11px] font-mono rounded"
        style={{
          color: caseSensitive ? "var(--cyan)" : "var(--fg-dim)",
        }}
        title="Case sensitive"
        aria-pressed={caseSensitive}
      >
        Aa
      </button>
      <button onClick={prev} className="p-1 text-[var(--fg-muted)] hover:text-[var(--fg)]" aria-label="Previous match">
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
      <button onClick={next} className="p-1 text-[var(--fg-muted)] hover:text-[var(--fg)]" aria-label="Next match">
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      <button onClick={onClose} className="p-1 text-[var(--fg-muted)] hover:text-[var(--rose)]" aria-label="Close find">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
