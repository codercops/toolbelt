"use client";

import { useMemo, useState } from "react";
import { diffLines, format } from "@/lib/json-utils";
import { cn } from "@/lib/cn";

interface DiffPanelProps {
  leftInput: string;
}

export function DiffPanel({ leftInput }: DiffPanelProps) {
  const [right, setRight] = useState("");

  const leftFormatted = useMemo(() => {
    const r = format(leftInput, 2);
    return r.ok ? r.value : leftInput;
  }, [leftInput]);
  const rightFormatted = useMemo(() => {
    const r = format(right, 2);
    return r.ok ? r.value : right;
  }, [right]);

  const rows = useMemo(() => diffLines(leftFormatted, rightFormatted), [leftFormatted, rightFormatted]);
  const stats = useMemo(() => {
    let add = 0;
    let del = 0;
    rows.forEach((r) => {
      if (r.type === "add") add++;
      else if (r.type === "del") del++;
    });
    return { add, del };
  }, [rows]);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
        <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
          JSON diff
        </span>
        <span className="flex items-center gap-3 font-mono text-[11px]">
          <span className="text-[var(--cyan)]">+{stats.add}</span>
          <span className="text-[var(--rose)]">-{stats.del}</span>
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[var(--hairline)]">
        <div className="p-3 bg-[var(--bg-soft)]">
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-2">
            Left (input)
          </div>
          <pre className="font-mono text-[12px] leading-[1.65] whitespace-pre-wrap break-all max-h-48 overflow-auto text-[var(--fg-muted)]">
            {leftFormatted || "(empty)"}
          </pre>
        </div>
        <div className="p-3">
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-2">
            Right (paste to compare)
          </div>
          <textarea
            value={right}
            onChange={(e) => setRight(e.target.value)}
            spellCheck={false}
            placeholder="Paste a second JSON to compare with the left side..."
            className="editor-input w-full text-[12px]"
            style={{ minHeight: 120 }}
          />
        </div>
      </div>
      {right && (
        <div className="border-t border-[var(--hairline)] max-h-[460px] overflow-auto animate-fade-in">
          <table className="w-full font-mono text-[12.5px] leading-[1.55]">
            <tbody>
              {rows.map((row, i) => {
                const bg =
                  row.type === "add"
                    ? "bg-[rgba(0,229,199,0.08)]"
                    : row.type === "del"
                    ? "bg-[rgba(255,77,109,0.08)]"
                    : "";
                const text =
                  row.type === "add"
                    ? "text-[var(--cyan)]"
                    : row.type === "del"
                    ? "text-[var(--rose)]"
                    : "text-[var(--fg)]";
                const sigil = row.type === "add" ? "+" : row.type === "del" ? "-" : " ";
                return (
                  <tr key={i} className={cn(bg)}>
                    <td className="px-2 py-0.5 text-[var(--fg-dim)] text-right select-none w-10">
                      {row.aLine ?? ""}
                    </td>
                    <td className="px-2 py-0.5 text-[var(--fg-dim)] text-right select-none w-10">
                      {row.bLine ?? ""}
                    </td>
                    <td className={cn("px-2 py-0.5 whitespace-pre-wrap break-all", text)}>
                      <span className="inline-block w-3 text-[var(--fg-dim)]">{sigil}</span>
                      {row.a ?? row.b ?? ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
