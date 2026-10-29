"use client";

import { useMemo, useState } from "react";
import { detectWords, toCase, CASE_STYLES } from "@/lib/case-utils";
import { CopyButton } from "@/components/shared/CopyButton";

export function CaseConverterClient() {
  const [input, setInput] = useState("");

  // Pure conversion — derived from the input, no effect needed.
  const outputs = useMemo(
    () =>
      CASE_STYLES.map((style) => ({
        ...style,
        value: input ? toCase(input, style.id) : "",
      })),
    [input]
  );
  const detectedLines = useMemo(() => detectWords(input), [input]);

  return (
    <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-10 space-y-4">
      <div className="card overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
          <label
            htmlFor="case-input"
            className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]"
          >
            Input text
          </label>
          <span className="font-mono text-[10.5px] text-[var(--fg-dim)]">
            {input.length} chars
          </span>
        </div>
        <textarea
          id="case-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"user_id\nXMLHttpRequest\n  Hello   World "}
          spellCheck={false}
          className="editor-input flex-1 p-4"
          style={{ minHeight: 180 }}
        />
      </div>

      <div className="card px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
            Detected words
          </h2>
          <span className="text-xs text-[var(--fg-muted)]">Uses the converter&apos;s existing split rules</span>
        </div>
        {detectedLines.length ? (
          <ul className="mt-3 space-y-2" aria-label="Detected words by input line">
            {detectedLines.map(({ lineNumber, words }) => (
              <li key={lineNumber} className="flex flex-wrap items-center gap-2">
                <span className="sr-only">Line {lineNumber}:</span>
                <span aria-hidden="true" className="w-12 shrink-0 font-mono text-xs text-[var(--fg-muted)]">
                  Line {lineNumber}
                </span>
                {words.map((word, index) => (
                  <span
                    key={`${lineNumber}-${index}-${word}`}
                    className="rounded-md border border-[var(--hairline)] bg-[var(--bg-raise)] px-2 py-1 font-mono text-sm text-[var(--fg)]"
                  >
                    {word}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[var(--fg-muted)]">
            Type or paste text above to see its detected words.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {outputs.map((o) => (
          <div key={o.id} className="card overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
              <span className="font-mono text-[10.5px] tracking-[0.22em] text-[var(--fg-dim)]">
                {o.label}
              </span>
              <CopyButton value={o.value} disabled={!o.value} className="py-1" />
            </div>
            <pre
              className="flex-1 p-4 font-mono text-[13px] leading-[1.7] whitespace-pre-wrap break-all overflow-auto text-[var(--fg)]"
              style={{ minHeight: 64 }}
            >
              {o.value || (
                <span className="text-[var(--fg-muted)]">
                  {input ? "—" : `${o.example}`}
                </span>
              )}
            </pre>
          </div>
        ))}
      </div>
    </section>
  );
}
