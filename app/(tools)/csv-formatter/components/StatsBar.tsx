"use client";

import { byteLength, delimiterLabel, lineEndingLabel, DELIMITERS, type ParsedCsv } from "@/lib/csv-utils";

export function StatsBar({ parsed, input }: { parsed: ParsedCsv; input: string }) {
  const short = DELIMITERS.find((entry) => entry.value === parsed.delimiter)?.short ?? parsed.delimiter;
  const issues = parsed.errors.length + parsed.warnings.length;

  return (
    <div className="card p-4 animate-fade-in" aria-label="CSV statistics">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <StatCell label="Rows" value={String(parsed.rowCount)} />
        <StatCell label="Columns" value={String(parsed.columnCount)} />
        <StatCell label="Delimiter" value={delimiterLabel(parsed.delimiter)} sub={short} />
        <StatCell
          label="Line endings"
          value={lineEndingLabel(parsed.lineEnding)}
          sub={parsed.mixedLineEndings ? "mixed" : "consistent"}
        />
        <StatCell label="Size" value={formatBytes(byteLength(input))} />
        <StatCell
          label="Issues"
          value={String(issues)}
          sub={`${parsed.errors.length} error${parsed.errors.length === 1 ? "" : "s"} · ${parsed.warnings.length} warning${parsed.warnings.length === 1 ? "" : "s"}`}
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
