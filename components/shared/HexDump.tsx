"use client";

import { useMemo } from "react";

interface HexDumpProps {
  bytes: Uint8Array;
  bytesPerRow?: number;
  maxRows?: number;
}

export function HexDump({ bytes, bytesPerRow = 16, maxRows = 256 }: HexDumpProps) {
  const rows = useMemo(() => {
    const out: { offset: string; hex: string[]; ascii: string }[] = [];
    const rowCount = Math.min(Math.ceil(bytes.length / bytesPerRow), maxRows);
    for (let r = 0; r < rowCount; r++) {
      const start = r * bytesPerRow;
      const slice = bytes.subarray(start, start + bytesPerRow);
      const hex: string[] = [];
      let ascii = "";
      for (let i = 0; i < bytesPerRow; i++) {
        if (i < slice.length) {
          hex.push(slice[i].toString(16).padStart(2, "0"));
          const c = slice[i];
          ascii += c >= 0x20 && c <= 0x7e ? String.fromCharCode(c) : ".";
        } else {
          hex.push("  ");
          ascii += " ";
        }
      }
      out.push({ offset: start.toString(16).padStart(8, "0"), hex, ascii });
    }
    return out;
  }, [bytes, bytesPerRow, maxRows]);

  const truncated = bytes.length > maxRows * bytesPerRow;

  return (
    <div className="font-mono text-[12px] leading-[1.55]">
      <div className="overflow-auto">
        <table className="w-full">
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-white/[0.02]">
                <td className="text-[var(--fg-dim)] select-none pr-4 whitespace-nowrap">
                  {row.offset}
                </td>
                <td className="text-[var(--amber)] whitespace-nowrap">
                  {row.hex.slice(0, bytesPerRow / 2).join(" ")}
                  <span className="inline-block w-2" />
                  {row.hex.slice(bytesPerRow / 2).join(" ")}
                </td>
                <td className="text-[var(--fg-muted)] pl-4 whitespace-pre">
                  {row.ascii}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {truncated && (
        <div className="mt-2 font-mono text-[11px] text-[var(--fg-dim)]">
          Showing first {maxRows * bytesPerRow} bytes of {bytes.length}.
        </div>
      )}
    </div>
  );
}
