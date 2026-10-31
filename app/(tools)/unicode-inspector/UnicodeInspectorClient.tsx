"use client";

import { useEffect, useMemo, useState } from "react";
import {
  inspectUnicode,
  getNormalization,
  EXAMPLES,
  INSPECTION_LIMIT,
  type CodePointRow,
} from "@/lib/unicode-inspector";
import { CopyButton } from "@/components/shared/CopyButton";
import { cn } from "@/lib/cn";

const MAX_INPUT_LENGTH = 500_000;
const DEBOUNCE_MS = 120;

const labelClass = "mb-1.5 block text-sm font-medium text-[var(--fg)]";
const headingClass =
  "font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]";

function CharCell({ row }: { row: CodePointRow }) {
  if (row.unpairedSurrogate) {
    return (
      <span
        className="inline-flex items-center justify-center rounded px-1.5 py-0.5 font-mono text-[11px] text-[var(--rose)] border border-tint-rose-40 bg-tint-rose-5"
        title="Unpaired UTF-16 surrogate (encoded as U+FFFD in UTF-8)"
      >
        ⚠ surrogate
      </span>
    );
  }
  if (row.invisibleLabel) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded px-1.5 py-0.5 font-mono text-[11px] border",
          row.intentional
            ? "text-[var(--sky)] border border-tint-sky-30 bg-tint-sky-5"
            : "text-[var(--amber)] border border-tint-amber-30 bg-tint-amber-5"
        )}
        title={row.intentional ? "Intentional invisible character" : "Invisible character"}
      >
        {row.invisibleLabel}
      </span>
    );
  }
  return (
    <span className="font-mono text-base text-[var(--fg)]" aria-label={`character ${row.char}`}>
      {row.char}
    </span>
  );
}

function NormalizationPanel({ input }: { input: string }) {
  const norm = useMemo(() => getNormalization(input), [input]);

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-[var(--hairline)] bg-[var(--bg-raise)] px-3 py-2">
        <h2 className={headingClass}>Normalization</h2>
      </div>
      <div className="p-4 sm:p-5 space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-medium text-[var(--fg)]">
              NFC
              {norm.nfcChanged ? (
                <span className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-tint-fuchsia-5 text-[var(--fuchsia)] border border-tint-fuchsia-30">
                  changes input
                </span>
              ) : (
                <span className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-[var(--bg-raise)] text-[var(--fg-dim)] border border-[var(--hairline)]">
                  no change
                </span>
              )}
            </span>
            <CopyButton
              value={norm.nfc}
              label="Copy NFC"
              ariaLabel="Copy NFC normalized text"
              successMessage="NFC text copied"
              className="py-1"
            />
          </div>
          <pre
            className="whitespace-pre-wrap break-words rounded-xl border border-[var(--hairline)] bg-[var(--bg)] p-3 font-mono text-[13px] leading-relaxed text-[var(--fg)] min-h-[2.5rem]"
            aria-label="NFC normalized text"
          >
            {norm.nfc || <span className="text-[var(--fg-dim)] not-italic">empty</span>}
          </pre>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-medium text-[var(--fg)]">
              NFD
              {norm.nfdChanged ? (
                <span className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-tint-fuchsia-5 text-[var(--fuchsia)] border border-tint-fuchsia-30">
                  changes input
                </span>
              ) : (
                <span className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-[var(--bg-raise)] text-[var(--fg-dim)] border border-[var(--hairline)]">
                  no change
                </span>
              )}
            </span>
            <CopyButton
              value={norm.nfd}
              label="Copy NFD"
              ariaLabel="Copy NFD normalized text"
              successMessage="NFD text copied"
              className="py-1"
            />
          </div>
          <pre
            className="whitespace-pre-wrap break-words rounded-xl border border-[var(--hairline)] bg-[var(--bg)] p-3 font-mono text-[13px] leading-relaxed text-[var(--fg)] min-h-[2.5rem]"
            aria-label="NFD normalized text"
          >
            {norm.nfd || <span className="text-[var(--fg-dim)] not-italic">empty</span>}
          </pre>
        </div>
      </div>
    </div>
  );
}

export function UnicodeInspectorClient() {
  const [raw, setRaw] = useState("");
  const [debouncedInput, setDebouncedInput] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedInput(raw), DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [raw]);

  const tooLong = raw.length > MAX_INPUT_LENGTH;
  const input = tooLong ? "" : debouncedInput;

  const result = useMemo(
    () => (input ? inspectUnicode(input) : null),
    [input]
  );

  const hasUnpaired = result?.rows.some((r) => r.unpairedSurrogate) ?? false;

  return (
    <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-10 space-y-4">
      <div className="card p-4 sm:p-5 space-y-4">
        <div>
          <label htmlFor="unicode-input" className={labelClass}>
            Text to inspect
          </label>
          <textarea
            id="unicode-input"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text/plain");
              if (!text.includes("\r")) return;
              e.preventDefault();
              const el = e.currentTarget;
              setRaw(el.value.slice(0, el.selectionStart) + text + el.value.slice(el.selectionEnd));
            }}
            rows={5}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="Paste or type any text…"
            className="w-full resize-y rounded-xl border border-[var(--hairline)] bg-[var(--bg)] p-3 font-mono text-[13px] leading-relaxed text-[var(--fg)] placeholder:text-[var(--fg-dim)]"
            aria-describedby={tooLong ? "unicode-too-long" : undefined}
          />
          {tooLong && (
            <p
              id="unicode-too-long"
              role="alert"
              className="mt-1.5 text-sm text-[var(--rose)]"
            >
              Input is limited to {MAX_INPUT_LENGTH.toLocaleString("en-US")} characters.
            </p>
          )}
        </div>

        <div>
          <p className={labelClass}>Quick examples</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Example presets">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                title={ex.description}
                onClick={() => setRaw(ex.text)}
                className="btn text-xs py-1 px-3"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {result && (
        <div className="card px-4 py-3 sm:px-5 flex flex-wrap gap-x-6 gap-y-2">
          <StatPill label="Code points" value={result.codePointCount} />
          <StatPill label="UTF-16 code units" value={result.utf16Count} />
          <StatPill label="UTF-8 bytes" value={result.utf8ByteCount} />
        </div>
      )}

      {hasUnpaired && (
        <p
          role="alert"
          className="rounded-xl border border-tint-rose-30 bg-tint-rose-5 p-3 text-sm text-[var(--rose)]"
        >
          ⚠ This string contains unpaired UTF-16 surrogates. They cannot be encoded as valid UTF-8. Each surrogate is replaced with{" "}
          <code className="font-mono">U+FFFD</code> (the replacement character) when converting to UTF-8.
        </p>
      )}

      {result && result.rows.length > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b border-[var(--hairline)] bg-[var(--bg-raise)] px-3 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <h2 className={headingClass}>
              {result.truncated
                ? `Showing first ${INSPECTION_LIMIT.toLocaleString("en-US")} of ${result.codePointCount.toLocaleString("en-US")} code points`
                : `${result.codePointCount.toLocaleString("en-US")} code point${result.codePointCount === 1 ? "" : "s"}`}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--fg-dim)]">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-[var(--amber)]" />
                <span>Amber = invisible characters worth checking</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-[var(--sky)]" />
                <span>Blue = usually intentional (joiners, bidi)</span>
              </span>
            </div>
          </div>

          {result.truncated && (
            <p className="border-b border-[var(--hairline)] bg-tint-amber-5 px-4 py-2 text-sm text-[var(--amber)]">
              Large input: inspection is limited to the first{" "}
              {INSPECTION_LIMIT.toLocaleString("en-US")} code points.
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Unicode code point details for each character in the input
              </caption>
              <thead>
                <tr className="border-b border-[var(--hairline)] text-[var(--fg-muted)] bg-[var(--bg-raise)]">
                  <th scope="col" className="px-3 py-2 font-medium whitespace-nowrap">Char</th>
                  <th scope="col" className="px-3 py-2 font-medium whitespace-nowrap">Code point</th>
                  <th scope="col" className="px-3 py-2 font-medium whitespace-nowrap">UTF-16 offset</th>
                  <th scope="col" className="px-3 py-2 font-medium whitespace-nowrap">UTF-16 units</th>
                  <th scope="col" className="px-3 py-2 font-medium whitespace-nowrap">UTF-8 bytes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--hairline)]">
                {result.rows.map((row, i) => (
                  <tr
                    key={`${row.utf16Offset}-${i}`}
                    className="hover:bg-[var(--bg-raise)] transition-colors"
                  >
                    <td className="px-3 py-2.5 min-w-[6rem]">
                      <CharCell row={row} />
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[var(--fuchsia)] whitespace-nowrap">
                      {row.codePointStr}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[var(--fg-muted)] whitespace-nowrap">
                      {row.utf16Offset}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[var(--fg-muted)] whitespace-nowrap">
                      {row.utf16Hex.join(" ")}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[var(--fg-muted)] whitespace-nowrap">
                      {row.utf8Hex.join(" ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && result.rows.length === 0 && !tooLong && (
        <div className="card px-4 py-8 text-center text-[var(--fg-dim)] text-sm">
          No characters to inspect. Type or paste text above.
        </div>
      )}

      {result && <NormalizationPanel input={input} />}
    </section>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-mono text-base font-semibold text-[var(--fg)]">
        {value.toLocaleString("en-US")}
      </span>
      <span className="text-xs text-[var(--fg-dim)]">{label}</span>
    </div>
  );
}
