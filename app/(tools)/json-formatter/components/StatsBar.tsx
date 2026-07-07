"use client";

import { useEffect, useState } from "react";
import { computeStats, gzipSize } from "@/lib/json-utils";

export function StatsBar({ input, output }: { input: string; output: string }) {
  const stats = computeStats(input);
  const [gzip, setGzip] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!output) return setGzip(null);
      const size = await gzipSize(output);
      if (!cancelled) setGzip(size);
    })();
    return () => {
      cancelled = true;
    };
  }, [output]);

  if (!stats) return null;
  const savedPct =
    stats.bytes > 0 ? Math.round(((stats.bytes - stats.bytesMin) / stats.bytes) * 100) : 0;

  return (
    <div className="card p-4 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <StatCell label="Size" value={fmt(stats.bytes)} />
        <StatCell label="Minified" value={`${fmt(stats.bytesMin)}`} sub={`-${savedPct}%`} />
        <StatCell label="Gzipped" value={gzip === null ? "…" : fmt(gzip)} />
        <StatCell label="Depth" value={String(stats.depth)} />
        <StatCell label="Keys" value={String(stats.totalKeys)} sub={`${stats.objects} obj · ${stats.arrays} arr`} />
        <StatCell
          label="Types"
          value={`${stats.types.string + stats.types.number + stats.types.boolean + stats.types.null} leaves`}
          sub={`s${stats.types.string} · n${stats.types.number} · b${stats.types.boolean} · ∅${stats.types.null}`}
        />
      </div>
    </div>
  );
}

function StatCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-[var(--hairline)] bg-[var(--bg-soft)] px-3 py-2">
      <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
        {label}
      </div>
      <div className="mt-0.5 font-display font-semibold text-[14.5px] text-[var(--fg)]">
        {value}
      </div>
      {sub && (
        <div className="font-mono text-[10.5px] text-[var(--fg-muted)] truncate">{sub}</div>
      )}
    </div>
  );
}

function fmt(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
